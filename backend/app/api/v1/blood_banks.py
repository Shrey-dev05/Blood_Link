from datetime import datetime, timedelta
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.entities import (
    Organization, InventoryItem, BloodRequest, RequestEvent, SourceMatch, Notification
)
from app.schemas.schemas import (
    OrganizationResponse, InventoryItemResponse, InventoryStockUpdate,
    InventoryReservePayload
)
from app.services.audit_service import log_audit_event

router = APIRouter(prefix="/blood-banks", tags=["Blood Bank Management"])

@router.get("", response_model=List[OrganizationResponse])
def list_blood_banks(db: Session = Depends(get_db)):
    return db.query(Organization).filter(Organization.type == "blood_bank").all()

@router.get("/{bank_id}/inventory", response_model=List[InventoryItemResponse])
def get_bank_inventory(bank_id: str, db: Session = Depends(get_db)):
    bank = db.query(Organization).filter(Organization.id == bank_id).first()
    if not bank:
        raise HTTPException(status_code=404, detail="Blood bank not found")
    
    items = db.query(InventoryItem).filter(InventoryItem.blood_bank_id == bank_id).all()
    for item in items:
        item.blood_bank_name = bank.name
    return items

@router.patch("/inventory/{item_id}", response_model=InventoryItemResponse)
def update_inventory_stock(
    item_id: str,
    payload: InventoryStockUpdate,
    db: Session = Depends(get_db)
):
    item = db.query(InventoryItem).filter(InventoryItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Inventory item not found")

    item.units_available = payload.units_available
    if payload.status:
        item.status = payload.status
    item.last_source_update = datetime.utcnow()
    db.commit()

    log_audit_event(
        db=db,
        actor_id="blood-bank-staff",
        actor_role="blood_bank_staff",
        action="UPDATE_INVENTORY",
        entity_type="InventoryItem",
        entity_id=item.id,
        details=f"{item.blood_group} {item.component}: {item.units_available} units, status: {item.status}"
    )

    if item.blood_bank:
        item.blood_bank_name = item.blood_bank.name
    return item

@router.post("/inventory/{item_id}/reserve")
def reserve_inventory(
    item_id: str,
    payload: InventoryReservePayload,
    db: Session = Depends(get_db)
):
    item = db.query(InventoryItem).filter(InventoryItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Inventory item not found")

    if item.units_available < payload.units_to_reserve:
        raise HTTPException(status_code=400, detail="Insufficient available units to reserve.")

    item.units_available -= payload.units_to_reserve
    item.units_reserved += payload.units_to_reserve
    item.last_source_update = datetime.utcnow()

    req = db.query(BloodRequest).filter(BloodRequest.id == payload.request_id).first()
    if req:
        if req.status == "MATCHING":
            req.status = "SOURCE_CONFIRMED"
        event = RequestEvent(
            request_id=req.id,
            actor_id="blood-bank-officer",
            actor_name="Blood Bank Officer",
            previous_state="MATCHING",
            new_state=req.status,
            event_type="STOCK_RESERVED",
            reason=f"Blood bank {item.blood_bank.name if item.blood_bank else 'Regional'} reserved {payload.units_to_reserve} units {item.blood_group} {item.component.upper()}."
        )
        db.add(event)

    db.commit()

    log_audit_event(
        db=db,
        actor_id="blood-bank-staff",
        actor_role="blood_bank_staff",
        action="RESERVE_INVENTORY",
        entity_type="InventoryItem",
        entity_id=item.id,
        details=f"Reserved {payload.units_to_reserve} units for request {payload.request_id}"
    )

    return {
        "status": "SUCCESS",
        "units_reserved": payload.units_to_reserve,
        "remaining_available": item.units_available,
        "reservation_reference": f"RES-{datetime.utcnow().strftime('%Y%m%d')}-{item_id[:6]}"
    }

@router.get("/{bank_id}/incoming-requests")
def get_bank_incoming_requests(bank_id: str, db: Session = Depends(get_db)):
    bank = db.query(Organization).filter(Organization.id == bank_id).first()
    if not bank:
        raise HTTPException(status_code=404, detail="Blood bank not found")

    matches = db.query(SourceMatch).filter(
        SourceMatch.source_type == "blood_bank",
        SourceMatch.source_id == bank_id
    ).all()

    results = []
    for m in matches:
        req = m.request
        if not req or req.status in ("FULFILLED", "CANCELLED", "EXPIRED"):
            continue
        hosp = req.hospital
        results.append({
            "match_id": m.id,
            "request_id": req.id,
            "patient_case_ref": req.patient_case_ref,
            "hospital_id": req.hospital_id,
            "hospital_name": hosp.name if hosp else "Hospital Center",
            "hospital_address": hosp.address if hosp else "Raipur",
            "hospital_phone": hosp.contact_phone if hosp else "+91-771-2235600",
            "blood_group": req.blood_group,
            "component": req.component,
            "quantity_required": req.quantity_required,
            "urgency": req.urgency,
            "destination_dept": req.destination_dept,
            "distance_km": m.distance_km,
            "response_state": m.response_state,
            "units_offered": m.units_offered,
            "notes": m.notes,
            "due_at": req.due_at,
            "created_at": req.created_at
        })

    return results

@router.post("/{bank_id}/requests/{request_id}/respond")
def respond_to_hospital_request(
    bank_id: str,
    request_id: str,
    action: str = "accept", # accept or decline
    units: Optional[int] = None,
    db: Session = Depends(get_db)
):
    bank = db.query(Organization).filter(Organization.id == bank_id).first()
    if not bank:
        raise HTTPException(status_code=404, detail="Blood bank not found")

    req = db.query(BloodRequest).filter(BloodRequest.id == request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")

    match = db.query(SourceMatch).filter(
        SourceMatch.request_id == request_id,
        SourceMatch.source_type == "blood_bank",
        SourceMatch.source_id == bank_id
    ).first()

    if not match:
        from app.services.matching_service import calculate_distance
        h_lat = req.hospital.latitude if req.hospital else 21.2559
        h_lon = req.hospital.longitude if req.hospital else 81.6226
        dist = calculate_distance(h_lat, h_lon, bank.latitude, bank.longitude)
        match = SourceMatch(
            request_id=req.id,
            source_type="blood_bank",
            source_id=bank.id,
            source_name=bank.name,
            contact_phone=bank.contact_phone,
            distance_km=dist,
            freshness_status="CONFIRMED",
            response_state="NOTIFIED",
            units_offered=req.quantity_required,
            notes=f"Emergency requisition response ({dist} km away)"
        )
        db.add(match)

    units_to_commit = units or req.quantity_required

    if action.lower() == "accept":
        match.response_state = "ACCEPTED"
        match.units_offered = units_to_commit
        match.responded_at = datetime.utcnow()
        match.notes = f"Accepted by {bank.name}. {units_to_commit} units ready for hospital dispatch/collection."

        if req.status == "MATCHING":
            req.status = "SOURCE_CONFIRMED"

        event = RequestEvent(
            request_id=req.id,
            actor_id=f"bank-{bank.id}",
            actor_name=bank.name,
            previous_state="MATCHING",
            new_state=req.status,
            event_type="BLOOD_BANK_ACCEPTED",
            reason=f"Blood bank {bank.name} ACCEPTED emergency request. {units_to_commit} units {req.blood_group} {req.component.upper()} confirmed for hospital dispatch."
        )
        db.add(event)

        notif = Notification(
            user_id=req.created_by_user_id or "hospital-command",
            request_id=req.id,
            title=f"✅ Blood Bank Accepted Supply ({bank.name})",
            body=f"{bank.name} has accepted to supply {units_to_commit} units of {req.blood_group} {req.component.upper()} for Case {req.patient_case_ref}. Ready for collection/dispatch.",
            priority=req.urgency,
            channel="IN_APP",
            status="DELIVERED"
        )
        db.add(notif)
    else:
        match.response_state = "DECLINED"
        match.responded_at = datetime.utcnow()
        match.notes = f"Declined by {bank.name} due to operational capacity/stock commitment."

    db.commit()
    db.refresh(match)

    return {
        "status": "SUCCESS",
        "response_state": match.response_state,
        "units_offered": match.units_offered,
        "message": f"Blood bank {bank.name} {match.response_state.lower()} the emergency request."
    }

