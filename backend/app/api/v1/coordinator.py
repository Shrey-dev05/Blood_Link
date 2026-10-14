from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.entities import BloodRequest, SourceMatch, Organization
from app.schemas.schemas import BloodRequestResponse

router = APIRouter(prefix="/coordinator", tags=["Emergency Coordinator"])

@router.get("/queue", response_model=list[BloodRequestResponse])
def get_urgent_queue(db: Session = Depends(get_db)):
    # Returns P0 and P1 requests requiring monitoring and intervention
    requests = db.query(BloodRequest).filter(
        BloodRequest.urgency.in_(["P0", "P1"]),
        BloodRequest.status.notin_(["FULFILLED", "CANCELLED", "EXPIRED"])
    ).order_by(BloodRequest.created_at.desc()).all()

    for r in requests:
        if r.hospital:
            r.hospital_name = r.hospital.name
    return requests

@router.get("/stats")
def get_coordination_stats(db: Session = Depends(get_db)):
    total_active = db.query(BloodRequest).filter(
        BloodRequest.status.notin_(["FULFILLED", "CANCELLED", "EXPIRED"])
    ).count()

    p0_critical = db.query(BloodRequest).filter(
        BloodRequest.urgency == "P0",
        BloodRequest.status.notin_(["FULFILLED", "CANCELLED", "EXPIRED"])
    ).count()

    total_fulfilled = db.query(BloodRequest).filter(
        BloodRequest.status == "FULFILLED"
    ).count()

    total_matches = db.query(SourceMatch).count()

    return {
        "active_emergency_requests": total_active,
        "p0_critical_count": p0_critical,
        "fulfilled_requests_count": total_fulfilled,
        "total_matches_generated": total_matches,
        "system_status": "NORMAL_OPERATING"
    }
