from datetime import datetime, timedelta
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Header
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.entities import BloodRequest, RequestEvent, Organization, User, SourceMatch
from app.schemas.schemas import (
    BloodRequestCreate, BloodRequestResponse, EscalateRequestPayload, 
    CancelRequestPayload, ConfirmFulfillmentPayload
)
from app.services.matching_service import run_parallel_matching
from app.services.audit_service import log_audit_event

router = APIRouter(prefix="/requests", tags=["Emergency Requests"])

@router.post("", response_model=BloodRequestResponse)
def create_blood_request(
    payload: BloodRequestCreate,
    x_user_id: Optional[str] = Header(None),
    db: Session = Depends(get_db)
):
    hospital = None
    if payload.hospital_id:
        hospital = db.query(Organization).filter(Organization.id == payload.hospital_id).first()
    
    # If not found or not provided, prefer Ambedkar Memorial Hospital Raipur or first hospital
    if not hospital:
        hospital = db.query(Organization).filter(
            Organization.type == "hospital",
            Organization.name.ilike("%ambedkar%")
        ).first()
    if not hospital:
        hospital = db.query(Organization).filter(Organization.type == "hospital").first()
    if not hospital:
        raise HTTPException(status_code=400, detail="No hospital organization registered in system.")

    user = None
    if x_user_id:
        user = db.query(User).filter(User.id == x_user_id).first()
    if not user:
        user = db.query(User).filter(User.role == "hospital_staff").first()

    due_at = datetime.utcnow() + timedelta(hours=payload.due_in_hours or 3)

    req = BloodRequest(
        hospital_id=hospital.id,
        created_by_user_id=user.id if user else hospital.id,
        patient_case_ref=payload.patient_case_ref,
        component=payload.component.lower(),
        blood_group=payload.blood_group.upper(),
        quantity_required=payload.quantity_required,
        quantity_fulfilled=0,
        urgency=payload.urgency,
        status="MATCHING", # Direct launch into matching
        destination_dept=payload.destination_dept,
        clinical_notes=payload.clinical_notes,
        escalation_stage="LOCAL",
        due_at=due_at
    )
    db.add(req)
    db.commit()
    db.refresh(req)

    # Add Creation Event
    event1 = RequestEvent(
        request_id=req.id,
        actor_id=user.id if user else "system",
        actor_name=user.display_name if user else "Hospital Staff",
        previous_state=None,
        new_state="MATCHING",
        event_type="CREATED",
        reason=f"Emergency request initiated for {req.quantity_required} units {req.blood_group} {req.component.upper()}"
    )
    db.add(event1)
    db.commit()

    # Trigger Parallel Matching (Broad radius: up to 150km for regional donor dispatch)
    run_parallel_matching(db, req, radius_km=150.0)

    # Log Audit
    log_audit_event(
        db=db,
        actor_id=user.id if user else "system",
        actor_role="hospital_staff",
        action="CREATE_REQUEST",
        entity_type="BloodRequest",
        entity_id=req.id,
        details=f"Case {req.patient_case_ref}, Urgency {req.urgency}, {req.quantity_required} units {req.blood_group}"
    )

    db.refresh(req)
    # Populate extra fields for response
    req.hospital_name = hospital.name
    return req

@router.get("", response_model=List[BloodRequestResponse])
def list_blood_requests(
    urgency: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(BloodRequest).order_by(BloodRequest.created_at.desc())
    if urgency:
        query = query.filter(BloodRequest.urgency == urgency)
    if status:
        query = query.filter(BloodRequest.status == status)
    
    requests = query.all()
    for r in requests:
        if r.hospital:
            r.hospital_name = r.hospital.name
    return requests

@router.get("/{request_id}", response_model=BloodRequestResponse)
def get_blood_request(request_id: str, db: Session = Depends(get_db)):
    req = db.query(BloodRequest).filter(BloodRequest.id == request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")
    if req.hospital:
        req.hospital_name = req.hospital.name
    return req

@router.post("/{request_id}/escalate", response_model=BloodRequestResponse)
def escalate_search(
    request_id: str,
    payload: EscalateRequestPayload,
    db: Session = Depends(get_db)
):
    req = db.query(BloodRequest).filter(BloodRequest.id == request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")

    old_stage = req.escalation_stage
    req.escalation_stage = payload.target_stage
    db.commit()

    radius = 50.0 if payload.target_stage == "DISTRICT" else 150.0
    run_parallel_matching(db, req, radius_km=radius)

    event = RequestEvent(
        request_id=req.id,
        actor_id="coordinator-01",
        actor_name="Emergency Coordinator",
        previous_state=req.status,
        new_state=req.status,
        event_type="ESCALATED",
        reason=f"Search expanded from {old_stage} to {payload.target_stage}: {payload.reason}"
    )
    db.add(event)
    db.commit()

    log_audit_event(
        db=db,
        actor_id="coordinator-01",
        actor_role="coordinator",
        action="ESCALATE_SEARCH",
        entity_type="BloodRequest",
        entity_id=req.id,
        details=f"Stage: {payload.target_stage}, Reason: {payload.reason}"
    )

    db.refresh(req)
    if req.hospital:
        req.hospital_name = req.hospital.name
    return req

@router.post("/{request_id}/cancel", response_model=BloodRequestResponse)
def cancel_blood_request(
    request_id: str,
    payload: CancelRequestPayload,
    db: Session = Depends(get_db)
):
    req = db.query(BloodRequest).filter(BloodRequest.id == request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")

    old_status = req.status
    req.status = "CANCELLED"
    db.commit()

    event = RequestEvent(
        request_id=req.id,
        actor_id="staff-user",
        actor_name="Authorized Staff",
        previous_state=old_status,
        new_state="CANCELLED",
        event_type="CANCELLED",
        reason=payload.reason
    )
    db.add(event)
    db.commit()

    log_audit_event(
        db=db,
        actor_id="staff-user",
        actor_role="hospital_staff",
        action="CANCEL_REQUEST",
        entity_type="BloodRequest",
        entity_id=req.id,
        details=payload.reason
    )

    db.refresh(req)
    if req.hospital:
        req.hospital_name = req.hospital.name
    return req

@router.post("/{request_id}/confirm-fulfillment", response_model=BloodRequestResponse)
def confirm_fulfillment(
    request_id: str,
    payload: ConfirmFulfillmentPayload,
    db: Session = Depends(get_db)
):
    req = db.query(BloodRequest).filter(BloodRequest.id == request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")

    old_status = req.status
    req.quantity_fulfilled += payload.units_confirmed
    if req.quantity_fulfilled >= req.quantity_required:
        req.status = "FULFILLED"
    else:
        req.status = "PARTIALLY_FULFILLED"

    db.commit()

    event = RequestEvent(
        request_id=req.id,
        actor_id="hospital-admin",
        actor_name="Blood Transfusion Officer",
        previous_state=old_status,
        new_state=req.status,
        event_type="FULFILLED" if req.status == "FULFILLED" else "PARTIALLY_FULFILLED",
        reason=f"Recorded {payload.units_confirmed} fulfilled units. Total: {req.quantity_fulfilled}/{req.quantity_required}. Notes: {payload.outcome_notes or 'All clinical verifications passed'}"
    )
    db.add(event)
    db.commit()

    log_audit_event(
        db=db,
        actor_id="hospital-admin",
        actor_role="hospital_staff",
        action="CONFIRM_FULFILLMENT",
        entity_type="BloodRequest",
        entity_id=req.id,
        details=f"Status: {req.status}, Fulfilled: {req.quantity_fulfilled}/{req.quantity_required}"
    )

    db.refresh(req)
    if req.hospital:
        req.hospital_name = req.hospital.name
    return req
