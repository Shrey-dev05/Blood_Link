from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
import random
from app.database import get_db
from app.models.entities import User, Organization, DonorProfile
from app.schemas.schemas import (
    UserResponse, DemoLoginRequest, DonorRegisterRequest, DonorLoginRequest, DonorAuthResponse
)

router = APIRouter(prefix="/auth", tags=["Authentication"])

CG_CITY_COORDS = {
    "raipur": (21.2514, 81.6296),
    "durg": (21.1904, 81.2849),
    "bhilai": (21.2167, 81.3833),
    "bilaspur": (22.0797, 82.1409),
    "bastar": (19.0748, 82.0084),
    "jagdalpur": (19.0748, 82.0084),
    "korba": (22.3595, 82.7501),
    "rajnandgaon": (21.0974, 81.0345),
    "raigarh": (21.8974, 83.3950),
    "ambikapur": (23.1197, 83.1977),
    "dhamtari": (20.7071, 81.5497),
    "mahasamund": (21.1094, 82.0967),
}

def resolve_coords(city_str: str):
    city_lower = (city_str or "").strip().lower()
    for name, coords in CG_CITY_COORDS.items():
        if name in city_lower:
            return round(coords[0] + random.uniform(-0.015, 0.015), 4), round(coords[1] + random.uniform(-0.015, 0.015), 4)
    return round(21.2514 + random.uniform(-0.02, 0.02), 4), round(81.6296 + random.uniform(-0.02, 0.02), 4)

@router.post("/donor/register", response_model=DonorAuthResponse)
def register_donor(payload: DonorRegisterRequest, db: Session = Depends(get_db)):
    clean_phone = payload.phone.strip()
    if not clean_phone.startswith("+"):
        clean_phone = f"+91{clean_phone.lstrip('0')}"
    
    # Check if user already exists with this phone or email
    user = db.query(User).filter(User.phone == clean_phone).first()
    if not user and payload.email:
        user = db.query(User).filter(User.email == payload.email.strip()).first()
    
    if not user:
        email = payload.email.strip() if payload.email else f"donor.{clean_phone[-10:]}@bloodlink.org"
        existing_email = db.query(User).filter(User.email == email).first()
        if existing_email:
            email = f"donor.{random.randint(10000, 99999)}@bloodlink.org"


        user = User(
            display_name=payload.display_name.strip(),
            email=email,
            phone=clean_phone,
            role="donor",
            account_status="active"
        )
        db.add(user)
        db.flush()
    else:
        user.display_name = payload.display_name.strip()
        user.phone = clean_phone
        user.role = "donor"
        user.account_status = "active"

    profile = db.query(DonorProfile).filter(DonorProfile.user_id == user.id).first()
    lat, lon = (payload.latitude, payload.longitude) if (payload.latitude and payload.longitude) else resolve_coords(payload.city)

    if not profile:
        donor_code = f"CG-DONOR-{random.randint(1040, 9999)}"
        profile = DonorProfile(
            user_id=user.id,
            donor_code=donor_code,
            blood_group=payload.blood_group.strip().upper(),
            blood_group_verified=True,
            city=payload.city.strip(),
            area=payload.area.strip(),
            latitude=lat,
            longitude=lon,
            opt_in_alerts=payload.opt_in_alerts,
            map_discoverable=payload.map_discoverable,
            availability_state="available",
            total_donations=0
        )
        db.add(profile)
    else:
        profile.blood_group = payload.blood_group.strip().upper()
        profile.city = payload.city.strip()
        profile.area = payload.area.strip()
        profile.latitude = lat
        profile.longitude = lon
        profile.opt_in_alerts = payload.opt_in_alerts
        profile.map_discoverable = payload.map_discoverable
        profile.availability_state = "available"

    db.commit()
    db.refresh(profile)

    return DonorAuthResponse(
        user_id=user.id,
        donor_id=profile.id,
        donor_code=profile.donor_code,
        display_name=user.display_name,
        phone=user.phone,
        email=user.email,
        blood_group=profile.blood_group,
        city=profile.city,
        area=profile.area,
        availability_state=profile.availability_state,
        opt_in_alerts=profile.opt_in_alerts,
        map_discoverable=profile.map_discoverable,
        total_donations=profile.total_donations,
        message="Donor registered successfully! Real-time emergency SMS and call alerts are now active."
    )

@router.post("/donor/login", response_model=DonorAuthResponse)
def login_donor(payload: DonorLoginRequest, db: Session = Depends(get_db)):
    ident = payload.identifier.strip()
    
    # Search by donor_code
    profile = db.query(DonorProfile).filter(DonorProfile.donor_code.ilike(ident)).first()
    
    # Search by phone or email
    if not profile:
        clean_num = ident.replace(" ", "").replace("-", "").replace("+", "")
        user = db.query(User).filter(
            (User.phone.ilike(f"%{clean_num[-10:] if len(clean_num) >= 10 else clean_num}%")) | 
            (User.email.ilike(ident))
        ).first()
        if user and user.donor_profile:
            profile = user.donor_profile

    # Search by name
    if not profile:
        user = db.query(User).filter(User.role == "donor", User.display_name.ilike(f"%{ident}%")).first()
        if user and user.donor_profile:
            profile = user.donor_profile

    if not profile:
        raise HTTPException(
            status_code=404,
            detail=f"No donor account found with '{ident}'. Please register or enter a valid mobile number / donor code."
        )

    user = profile.user
    return DonorAuthResponse(
        user_id=profile.user_id,
        donor_id=profile.id,
        donor_code=profile.donor_code,
        display_name=user.display_name if user else "Verified Donor",
        phone=user.phone if user else None,
        email=user.email if user else None,
        blood_group=profile.blood_group,
        city=profile.city,
        area=profile.area,
        availability_state=profile.availability_state,
        opt_in_alerts=profile.opt_in_alerts,
        map_discoverable=profile.map_discoverable,
        total_donations=profile.total_donations,
        message=f"Welcome back, {user.display_name if user else 'Donor'}!"
    )

@router.post("/demo-login", response_model=UserResponse)
def demo_login(payload: DemoLoginRequest, db: Session = Depends(get_db)):
    query = db.query(User).filter(User.role == payload.role)
    if payload.email:
        query = db.query(User).filter(User.email == payload.email)
    
    user = query.first()
    if not user:
        raise HTTPException(status_code=404, detail=f"No seed user found for role '{payload.role}'. Run seed first.")
    
    return user

@router.get("/me", response_model=UserResponse)
def get_current_user(
    x_user_role: str = Header(default="hospital_staff"),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.role == x_user_role).first()
    if not user:
        user = db.query(User).first()
    if not user:
        raise HTTPException(status_code=404, detail="No users found in database.")
    return user

@router.get("/users", response_model=list[UserResponse])
def list_demo_users(db: Session = Depends(get_db)):
    return db.query(User).all()

