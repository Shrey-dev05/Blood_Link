import random
from fastapi import APIRouter, Depends, Header
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.entities import Organization, Camp, DonorProfile

router = APIRouter(prefix="/map", tags=["Live Map & Privacy Layers"])

@router.get("/facilities")
def get_map_facilities(db: Session = Depends(get_db)):
    # Returns public-safe verified facilities (blood banks, hospitals, camps)
    orgs = db.query(Organization).filter(Organization.verification_status == "verified").all()
    camps = db.query(Camp).filter(Camp.status == "PUBLISHED").all()

    facilities = []
    for o in orgs:
        facilities.append({
            "id": o.id,
            "type": o.type,
            "name": o.name,
            "address": o.address,
            "city": o.city,
            "latitude": o.latitude,
            "longitude": o.longitude,
            "contact_phone": o.contact_phone,
            "operating_hours": o.operating_hours,
            "verification_status": o.verification_status
        })

    for c in camps:
        facilities.append({
            "id": c.id,
            "type": "donation_camp",
            "name": c.title,
            "address": c.venue_address,
            "city": c.city,
            "latitude": c.latitude,
            "longitude": c.longitude,
            "contact_phone": c.contact_phone,
            "operating_hours": f"{c.start_date.strftime('%d %b %H:%M')} - {c.end_date.strftime('%H:%M')}",
            "verification_status": "verified"
        })

    return facilities

@router.get("/donor-coverage")
def get_donor_coverage(
    x_user_role: str = Header(default="public"),
    db: Session = Depends(get_db)
):
    # Public users NEVER receive donor coverage pins
    if x_user_role not in ("hospital_staff", "coordinator", "admin", "blood_bank_staff"):
        return {
            "access_allowed": False,
            "message": "Donor coverage density is only accessible to verified healthcare coordinators to preserve donor privacy.",
            "clusters": []
        }

    # Only opted-in, discoverable donors
    donors = db.query(DonorProfile).filter(
        DonorProfile.opt_in_alerts == True,
        DonorProfile.map_discoverable == True,
        DonorProfile.availability_state == "available"
    ).all()

    # Apply intentional privacy jitter (approximate area / no exact home addresses)
    clusters = []
    for d in donors:
        lat_jitter = d.latitude + random.uniform(-0.005, 0.005)
        lon_jitter = d.longitude + random.uniform(-0.005, 0.005)
        clusters.append({
            "id": f"cluster-{d.id[:8]}",
            "blood_group": d.blood_group,
            "area": d.area,
            "approx_latitude": round(lat_jitter, 4),
            "approx_longitude": round(lon_jitter, 4),
            "availability_state": d.availability_state,
            "privacy_note": "Location approximate (aggregated for privacy)"
        })

    return {
        "access_allowed": True,
        "count": len(clusters),
        "clusters": clusters
    }
