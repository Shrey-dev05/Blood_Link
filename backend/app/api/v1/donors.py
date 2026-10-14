from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.entities import (
    DonorProfile, User, BloodRequest, SourceMatch, QRPass, RequestEvent, Notification
)
from app.schemas.schemas import (
    DonorProfileResponse, DonorAvailabilityUpdate, DonorConsentUpdate,
    BloodRequestResponse, QRPassResponse, SourceMatchResponse
)
from app.services.qr_service import issue_qr_pass
from app.services.audit_service import log_audit_event

router = APIRouter(prefix="/donors", tags=["Donor Portal"])

@router.get("/me", response_model=DonorProfileResponse)
def get_donor_profile(
    x_user_id: Optional[str] = Header(None),
    x_donor_id: Optional[str] = Header(None),
    donor_id: Optional[str] = None,
    db: Session = Depends(get_db)
):
    profile = None
    target_donor_id = x_donor_id or donor_id
    if target_donor_id:
        profile = db.query(DonorProfile).filter(DonorProfile.id == target_donor_id).first()
    if not profile and x_user_id:
        profile = db.query(DonorProfile).filter(DonorProfile.user_id == x_user_id).first()
    if not profile:
        profile = db.query(DonorProfile).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Donor profile not found")

    res = DonorProfileResponse.from_orm(profile)
    if profile.user:
        res.display_name = profile.user.display_name
    return res


@router.post("/me/availability", response_model=DonorProfileResponse)
def update_availability(
    payload: DonorAvailabilityUpdate,
    x_user_id: Optional[str] = Header(None),
    db: Session = Depends(get_db)
):
    profile = db.query(DonorProfile).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Donor profile not found")

    profile.availability_state = payload.availability_state
    profile.availability_confirmed_at = datetime.utcnow()
    db.commit()

    log_audit_event(
        db=db,
        actor_id=profile.user_id,
        actor_role="donor",
        action="UPDATE_AVAILABILITY",
        entity_type="DonorProfile",
        entity_id=profile.id,
        details=f"Set to {payload.availability_state}"
    )

    res = DonorProfileResponse.from_orm(profile)
    if profile.user:
        res.display_name = profile.user.display_name
    return res

@router.post("/me/consent", response_model=DonorProfileResponse)
def update_consent(
    payload: DonorConsentUpdate,
    db: Session = Depends(get_db)
):
    profile = db.query(DonorProfile).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Donor profile not found")

    if payload.opt_in_alerts is not None:
        profile.opt_in_alerts = payload.opt_in_alerts
    if payload.map_discoverable is not None:
        profile.map_discoverable = payload.map_discoverable

    db.commit()

    log_audit_event(
        db=db,
        actor_id=profile.user_id,
        actor_role="donor",
        action="UPDATE_CONSENT",
        entity_type="DonorProfile",
        entity_id=profile.id,
        details=f"opt_in={profile.opt_in_alerts}, discoverable={profile.map_discoverable}"
    )

    res = DonorProfileResponse.from_orm(profile)
    if profile.user:
        res.display_name = profile.user.display_name
    return res

@router.get("/requests/inbox")
def get_donor_inbox(
    x_donor_id: Optional[str] = Header(None),
    donor_id: Optional[str] = None,
    db: Session = Depends(get_db)
):
    target_id = x_donor_id or donor_id
    donor = None
    if target_id:
        donor = db.query(DonorProfile).filter(DonorProfile.id == target_id).first()
    if not donor:
        donor = db.query(DonorProfile).first()

    donor_group = donor.blood_group if donor else "O+"
    
    # Existing matches for this donor
    matches = db.query(SourceMatch).filter(
        SourceMatch.source_type == "donor",
        SourceMatch.source_id == donor.id if donor else ""
    ).all() if donor else []
    
    matched_req_ids = {m.request_id: m for m in matches}

    # Fetch all active open requests
    active_requests = db.query(BloodRequest).filter(
        BloodRequest.status.in_(["MATCHING", "SOURCE_CONFIRMED", "FULFILLMENT_IN_PROGRESS"])
    ).order_by(BloodRequest.created_at.desc()).all()

    results = []
    from app.services.matching_service import COMPATIBILITY_MAP

    for req in active_requests:
        # Check if donor's group is strictly compatible or general broadcast
        compatible_groups = COMPATIBILITY_MAP.get(req.blood_group, [req.blood_group])
        is_compatible = donor_group in compatible_groups
        has_match = req.id in matched_req_ids

        existing_match = matched_req_ids.get(req.id)
        resp_state = existing_match.response_state if existing_match else "NOTIFIED"
        match_id = existing_match.id if existing_match else f"lead-{req.id}"
        dist = existing_match.distance_km if existing_match else 4.5

        # Check if donor already has an issued QR pass for this request
        active_pass = None
        if donor:
            active_pass = db.query(QRPass).filter(
                QRPass.donor_id == donor.id,
                QRPass.request_id == req.id
            ).order_by(QRPass.issued_at.desc()).first()

        results.append({
            "match_id": match_id,
            "donor_id": donor.id if donor else "cg-donor-01",
            "request_id": req.id,
            "urgency": req.urgency,
            "status": req.status,
            "patient_case_ref": req.patient_case_ref,
            "component": req.component,
            "blood_group": req.blood_group,
            "quantity_required": req.quantity_required,
            "quantity_fulfilled": req.quantity_fulfilled,
            "hospital_name": req.hospital.name if req.hospital else "Emergency Blood Center",
            "hospital_address": req.hospital.address if req.hospital else "Main Medical Campus",
            "hospital_phone": req.hospital.contact_phone if req.hospital else "+91-771-2235600",
            "destination_dept": req.destination_dept,
            "distance_km": dist,
            "response_state": resp_state,
            "pass_code": active_pass.pass_code if active_pass else None,
            "due_at": req.due_at,
            "created_at": req.created_at
        })
    return results

@router.post("/requests/{request_id}/respond")
def respond_to_request(
    request_id: str,
    action: str, # accept or decline
    donor_id: Optional[str] = None,
    x_donor_id: Optional[str] = Header(None),
    db: Session = Depends(get_db)
):
    target_donor_id = x_donor_id or donor_id

    req = db.query(BloodRequest).filter(BloodRequest.id == request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")

    # Locate match
    match_query = db.query(SourceMatch).filter(
        SourceMatch.request_id == request_id,
        SourceMatch.source_type == "donor"
    )
    if target_donor_id:
        match_query = match_query.filter(SourceMatch.source_id == target_donor_id)
    
    match = match_query.first()
    donor = None
    if target_donor_id:
        donor = db.query(DonorProfile).filter(DonorProfile.id == target_donor_id).first()
    if not donor:
        donor = db.query(DonorProfile).first()

    if not match:
        # Create match on the fly for accepting donor
        donor_name = donor.user.display_name if (donor and donor.user) else "Verified Donor"
        match = SourceMatch(
            request_id=req.id,
            source_type="donor",
            source_id=donor.id if donor else "cg-donor-01",
            source_name=f"{donor_name} ({donor.blood_group if donor else 'O+'})",
            contact_phone="REDACTED_UNTIL_ACCEPTED",
            distance_km=3.5,
            freshness_status="CONFIRMED",
            response_state="NOTIFIED",
            units_offered=1,
            notes=f"Accepted direct broadcast lead"
        )
        db.add(match)
        db.commit()
        db.refresh(match)

    if action.lower() == "accept":
        match.response_state = "ACCEPTED"
        match.responded_at = datetime.utcnow()
        if req.status == "MATCHING":
            req.status = "SOURCE_CONFIRMED"

        # Issue QR Pass immediately for the accepted donor!
        qr_pass = issue_qr_pass(
            db=db,
            donor_id=donor.id,
            request_id=req.id,
            facility_id=req.hospital_id
        )

        event = RequestEvent(
            request_id=req.id,
            actor_id=donor.user_id,
            actor_name=donor.user.display_name if donor.user else "Donor",
            previous_state="MATCHING",
            new_state=req.status,
            event_type="DONOR_ACCEPTED",
            reason=f"Donor accepted emergency notification. QR Pass {qr_pass.pass_code} issued."
        )
        db.add(event)
        db.commit()

        return {
            "status": "ACCEPTED",
            "message": "Thank you for accepting! Your donation QR Pass is ready.",
            "pass_code": qr_pass.pass_code,
            "expires_at": qr_pass.expires_at,
            "facility_name": req.hospital.name if req.hospital else "Hospital Blood Center",
            "facility_address": req.hospital.address if req.hospital else "Medical Campus",
            "facility_phone": req.hospital.contact_phone if req.hospital else "+91-11-26588500"
        }
    else:
        match.response_state = "DECLINED"
        match.responded_at = datetime.utcnow()
        db.commit()
        return {
            "status": "DECLINED",
            "message": "Understood. Thank you for notifying us."
        }

@router.post("/requests/{request_id}/travel")
def mark_travelling(request_id: str, db: Session = Depends(get_db)):
    donor = db.query(DonorProfile).first()
    match = db.query(SourceMatch).filter(
        SourceMatch.request_id == request_id,
        SourceMatch.source_id == donor.id
    ).first()
    if match:
        match.response_state = "TRAVELLING"
        req = db.query(BloodRequest).filter(BloodRequest.id == request_id).first()
        if req:
            req.status = "FULFILLMENT_IN_PROGRESS"
            event = RequestEvent(
                request_id=req.id,
                actor_id=donor.user_id,
                actor_name=donor.user.display_name if donor.user else "Donor",
                previous_state="SOURCE_CONFIRMED",
                new_state="FULFILLMENT_IN_PROGRESS",
                event_type="DONOR_TRAVELLING",
                reason="Donor is currently en route to the collection centre."
            )
            db.add(event)
        db.commit()
    return {"status": "TRAVELLING", "message": "Hospital notified that you are travelling."}
