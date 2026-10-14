import random
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.entities import Camp, CampRegistration, Organization, DonorProfile
from app.schemas.schemas import CampResponse, CampCreate, CampRegisterPayload
from app.services.audit_service import log_audit_event

router = APIRouter(prefix="/camps", tags=["Donation Camps"])

@router.get("", response_model=List[CampResponse])
def list_camps(
    city: Optional[str] = None,
    status: Optional[str] = "PUBLISHED",
    db: Session = Depends(get_db)
):
    query = db.query(Camp)
    if status:
        query = query.filter(Camp.status == status)
    if city:
        query = query.filter(Camp.city.ilike(f"%{city}%"))
    
    camps = query.order_by(Camp.start_date.asc()).all()
    for c in camps:
        if c.organizer:
            c.organizer_name = c.organizer.name
    return camps

@router.post("", response_model=CampResponse)
def create_camp(
    payload: CampCreate,
    x_organizer_id: Optional[str] = Header(None),
    db: Session = Depends(get_db)
):
    organizer = None
    if x_organizer_id:
        organizer = db.query(Organization).filter(Organization.id == x_organizer_id).first()
    if not organizer:
        organizer = db.query(Organization).filter(Organization.type == "ngo_organizer").first()
    if not organizer:
        organizer = db.query(Organization).first()

    camp = Camp(
        organizer_id=organizer.id if organizer else "ngo-01",
        title=payload.title,
        description=payload.description,
        venue_address=payload.venue_address,
        city=payload.city,
        latitude=payload.latitude,
        longitude=payload.longitude,
        start_date=payload.start_date,
        end_date=payload.end_date,
        target_capacity=payload.target_capacity,
        contact_phone=payload.contact_phone,
        partner_blood_bank=payload.partner_blood_bank or "Red Cross Regional Center",
        status="PUBLISHED"
    )
    db.add(camp)
    db.commit()
    db.refresh(camp)

    log_audit_event(
        db=db,
        actor_id=organizer.id if organizer else "organizer-user",
        actor_role="organizer",
        action="CREATE_CAMP",
        entity_type="Camp",
        entity_id=camp.id,
        details=f"Created drive: {camp.title} at {camp.city}"
    )

    camp.organizer_name = organizer.name if organizer else "NGO Partner"
    return camp

@router.post("/{camp_id}/register")
def register_donor_for_camp(
    camp_id: str,
    payload: CampRegisterPayload,
    db: Session = Depends(get_db)
):
    camp = db.query(Camp).filter(Camp.id == camp_id).first()
    if not camp:
        raise HTTPException(status_code=404, detail="Camp not found")

    # Check duplicate
    existing = db.query(CampRegistration).filter(
        CampRegistration.camp_id == camp_id,
        CampRegistration.donor_id == payload.donor_id,
        CampRegistration.status == "REGISTERED"
    ).first()

    if existing:
        return {
            "status": "ALREADY_REGISTERED",
            "registration_code": existing.registration_code,
            "message": "You are already registered for this blood drive!"
        }

    # Check capacity
    if camp.registered_count >= camp.target_capacity:
        raise HTTPException(status_code=400, detail="Camp target capacity reached. Please check upcoming drives.")

    reg_code = f"CAMP-{random.randint(1000, 9999)}"
    reg = CampRegistration(
        camp_id=camp.id,
        donor_id=payload.donor_id,
        registration_code=reg_code,
        status="REGISTERED"
    )
    db.add(reg)
    camp.registered_count += 1
    db.commit()

    return {
        "status": "SUCCESS",
        "registration_code": reg_code,
        "message": "Successfully registered! Show this code or QR at the camp check-in desk.",
        "camp_title": camp.title,
        "venue": camp.venue_address,
        "start_date": camp.start_date
    }

@router.post("/{camp_id}/check-in")
def check_in_attendee(
    camp_id: str,
    registration_code: str,
    db: Session = Depends(get_db)
):
    reg = db.query(CampRegistration).filter(
        CampRegistration.camp_id == camp_id,
        CampRegistration.registration_code == registration_code.strip().upper()
    ).first()

    if not reg:
        raise HTTPException(status_code=404, detail="Registration code not found for this camp.")

    if reg.status == "ATTENDED":
        return {"status": "ALREADY_CHECKED_IN", "message": f"Already checked in at {reg.attended_at}."}

    reg.status = "ATTENDED"
    reg.attended_at = datetime.utcnow()
    
    camp = db.query(Camp).filter(Camp.id == camp_id).first()
    if camp:
        camp.attended_count += 1
    db.commit()

    return {
        "status": "CHECKED_IN",
        "message": "Attendee check-in verified successfully!",
        "donor_id": reg.donor_id
    }
