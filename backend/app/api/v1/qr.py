from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.entities import QRPass, BloodRequest, DonorProfile, DonationEvent, RequestEvent, SourceMatch
from app.schemas.schemas import (
    QRPassResponse, QRValidatePayload, QRValidateResult,
    ClinicalScreeningPayload, DonationOutcomePayload
)
from app.services.qr_service import validate_qr_pass, issue_qr_pass
from app.services.audit_service import log_audit_event

router = APIRouter(prefix="", tags=["QR Verification & Donation Lifecycle"])

@router.post("/qr/validate", response_model=QRValidateResult)
def validate_donor_qr(
    payload: QRValidatePayload,
    x_staff_id: Optional[str] = Header(None),
    db: Session = Depends(get_db)
):
    result = validate_qr_pass(
        db=db,
        code_or_token=payload.code_or_token,
        facility_id=payload.facility_id
    )

    if result["valid"]:
        # Log Request Event for Timeline
        req_id = result.get("request_id")
        donor_code = result.get("donor_code")
        if req_id:
            req = db.query(BloodRequest).filter(BloodRequest.id == req_id).first()
            if req:
                req.status = "FULFILLMENT_IN_PROGRESS"
                
                # Update any matching donor source match state
                donor = db.query(DonorProfile).filter(DonorProfile.donor_code == donor_code).first()
                if donor:
                    match = db.query(SourceMatch).filter(
                        SourceMatch.request_id == req_id,
                        SourceMatch.source_type == "donor",
                        SourceMatch.source_id == donor.id
                    ).first()
                    if match:
                        match.response_state = "ARRIVED_QR_VERIFIED"
                
                event = RequestEvent(
                    request_id=req.id,
                    actor_id=x_staff_id or "hospital-triage",
                    actor_name="Triage / Reception Desk",
                    previous_state="SOURCE_CONFIRMED",
                    new_state="FULFILLMENT_IN_PROGRESS",
                    event_type="QR_SCANNED",
                    reason=f"Arrival registered via QR Scan for Donor {result.get('donor_code')}."
                )
                db.add(event)
                db.commit()

        log_audit_event(
            db=db,
            actor_id=x_staff_id or "hospital-scanner",
            actor_role="hospital_staff",
            action="QR_SCAN_SUCCESS",
            entity_type="QRPass",
            entity_id=payload.code_or_token,
            details=f"Donor {result.get('donor_code')} verified at facility."
        )
    else:
        log_audit_event(
            db=db,
            actor_id=x_staff_id or "hospital-scanner",
            actor_role="hospital_staff",
            action="QR_SCAN_FAILED",
            entity_type="QRPass",
            entity_id=payload.code_or_token,
            details=f"Failure reason: {result['message']}"
        )

    return result

@router.post("/donations/pass", response_model=QRPassResponse)
def get_or_issue_pass(
    donor_id: str,
    request_id: str,
    facility_id: str,
    db: Session = Depends(get_db)
):
    qr_pass = issue_qr_pass(db, donor_id, request_id, facility_id)
    return {
        "id": qr_pass.id,
        "pass_code": qr_pass.pass_code,
        "token": qr_pass.token_hash,
        "donor_id": qr_pass.donor_id,
        "request_id": qr_pass.request_id,
        "facility_id": qr_pass.facility_id,
        "facility_name": qr_pass.request.hospital.name if qr_pass.request and qr_pass.request.hospital else "Hospital Blood Center",
        "facility_address": qr_pass.request.hospital.address if qr_pass.request and qr_pass.request.hospital else "Main Campus",
        "issued_at": qr_pass.issued_at,
        "expires_at": qr_pass.expires_at,
        "status": qr_pass.status
    }

@router.post("/donations/screening")
def record_clinical_screening(
    request_id: str,
    payload: ClinicalScreeningPayload,
    x_staff_id: Optional[str] = Header(None),
    db: Session = Depends(get_db)
):
    req = db.query(BloodRequest).filter(BloodRequest.id == request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")

    donor = db.query(DonorProfile).filter(DonorProfile.id == payload.donor_id).first()
    if not donor:
        raise HTTPException(status_code=404, detail="Donor not found")

    event = RequestEvent(
        request_id=req.id,
        actor_id=x_staff_id or "doctor-triage",
        actor_name="Clinical Screening Officer",
        previous_state=req.status,
        new_state=req.status,
        event_type="CLINICAL_SCREENING",
        reason=f"Screening outcome: {payload.screening_status}. Notes: {payload.notes or 'Standard Hb & vitals check'}"
    )
    db.add(event)
    db.commit()

    log_audit_event(
        db=db,
        actor_id=x_staff_id or "doctor-triage",
        actor_role="hospital_staff",
        action="SCREENING_RECORDED",
        entity_type="BloodRequest",
        entity_id=req.id,
        details=f"Donor {donor.donor_code}: {payload.screening_status}"
    )

    return {
        "status": "RECORDED",
        "screening_status": payload.screening_status,
        "message": f"Screening recorded: {payload.screening_status}. Ready for phlebotomy." if payload.screening_status == "ELIGIBLE" else "Donor safely deferred."
    }

@router.post("/donations/outcome")
def record_donation_outcome(
    request_id: str,
    payload: DonationOutcomePayload,
    x_staff_id: Optional[str] = Header(None),
    db: Session = Depends(get_db)
):
    req = db.query(BloodRequest).filter(BloodRequest.id == request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")

    donor = db.query(DonorProfile).filter(DonorProfile.id == payload.donor_id).first()
    if not donor:
        raise HTTPException(status_code=404, detail="Donor not found")

    # Record official donation event
    don_event = DonationEvent(
        donor_id=donor.id,
        request_id=req.id,
        facility_id=req.hospital_id,
        verified_by_user_id=x_staff_id or req.hospital_id,
        arrival_verified_at=datetime.utcnow(),
        screening_status="ELIGIBLE",
        donation_outcome=payload.donation_outcome,
        official_unit_barcode=payload.official_unit_barcode,
        units_collected=payload.units_collected,
        recorded_at=datetime.utcnow()
    )
    db.add(don_event)

    # Increment donor stats
    donor.total_donations += payload.units_collected
    donor.last_donation_date = datetime.utcnow()

    # Timeline event
    event = RequestEvent(
        request_id=req.id,
        actor_id=x_staff_id or "phlebotomy-staff",
        actor_name="Phlebotomy Team",
        previous_state=req.status,
        new_state=req.status,
        event_type="DONATION_COLLECTED",
        reason=f"Collected {payload.units_collected} unit(s). Barcode ID: {payload.official_unit_barcode}."
    )
    db.add(event)
    db.commit()

    log_audit_event(
        db=db,
        actor_id=x_staff_id or "phlebotomy-staff",
        actor_role="hospital_staff",
        action="DONATION_RECORDED",
        entity_type="DonationEvent",
        entity_id=don_event.id,
        details=f"Barcode: {payload.official_unit_barcode}, Units: {payload.units_collected}"
    )

    return {
        "status": "RECORDED",
        "donation_id": don_event.id,
        "official_unit_barcode": payload.official_unit_barcode,
        "units_collected": payload.units_collected,
        "message": "Donation event logged successfully. Ready for hospital fulfillment confirmation."
    }
