import hashlib
import random
import secrets
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app.models.entities import QRPass, BloodRequest, DonorProfile, Organization, User
from app.config import settings

def issue_qr_pass(db: Session, donor_id: str, request_id: str, facility_id: str) -> QRPass:
    # Check if active pass already exists
    existing = db.query(QRPass).filter(
        QRPass.donor_id == donor_id,
        QRPass.request_id == request_id,
        QRPass.status == "ISSUED",
        QRPass.expires_at > datetime.utcnow()
    ).first()

    if existing:
        return existing

    raw_token = secrets.token_urlsafe(32)
    token_hash = hashlib.sha256(raw_token.encode()).hexdigest()
    pass_code = f"RR-{random.randint(1000, 9999)}"

    expires_at = datetime.utcnow() + timedelta(minutes=settings.QR_TOKEN_TTL_MINUTES)

    qr_pass = QRPass(
        token_hash=token_hash,
        pass_code=pass_code,
        donor_id=donor_id,
        request_id=request_id,
        facility_id=facility_id,
        issued_at=datetime.utcnow(),
        expires_at=expires_at,
        status="ISSUED"
    )
    db.add(qr_pass)
    db.commit()
    db.refresh(qr_pass)
    return qr_pass

def validate_qr_pass(db: Session, code_or_token: str, facility_id: str = None) -> dict:
    # Support searching by readable pass_code (e.g. RR-9821) or token_hash
    target = code_or_token.strip().upper()
    
    qr_pass = db.query(QRPass).filter(
        (QRPass.pass_code == target) | (QRPass.token_hash == code_or_token)
    ).first()

    if not qr_pass:
        return {
            "valid": False,
            "status": "NOT_FOUND",
            "message": "Invalid QR pass code. No record found."
        }

    # Check expiration
    if qr_pass.expires_at < datetime.utcnow():
        qr_pass.status = "EXPIRED"
        db.commit()
        return {
            "valid": False,
            "status": "EXPIRED",
            "message": f"This donation pass expired at {qr_pass.expires_at.strftime('%H:%M')}."
        }

    # Check if already used
    if qr_pass.status in ("USED", "VALIDATED"):
        return {
            "valid": False,
            "status": "ALREADY_USED",
            "message": f"This pass was already used at {qr_pass.used_at}."
        }

    if qr_pass.status == "REVOKED":
        return {
            "valid": False,
            "status": "REVOKED",
            "message": "This donation pass was revoked by the coordinator or donor."
        }

    # Check facility scope if provided
    if facility_id and qr_pass.facility_id != facility_id:
        return {
            "valid": False,
            "status": "WRONG_FACILITY",
            "message": "This pass was issued for a different medical facility."
        }

    # Fetch associated request and donor details for permitted staff view
    request = db.query(BloodRequest).filter(BloodRequest.id == qr_pass.request_id).first()
    donor = db.query(DonorProfile).filter(DonorProfile.id == qr_pass.donor_id).first()

    # Mark as validated/used
    qr_pass.status = "USED"
    qr_pass.used_at = datetime.utcnow()
    db.commit()

    dest = request.destination_dept if request else "Emergency Transfusion Desk"
    dept = dest
    bed = "Bed #3 (Emergency Triage)"
    if "—" in dest:
        parts = [p.strip() for p in dest.split("—")]
        dept = parts[0]
        bed = parts[1] if len(parts) > 1 else "Bed Assigned"
    elif "," in dest:
        parts = [p.strip() for p in dest.split(",")]
        dept = parts[0]
        bed = parts[1] if len(parts) > 1 else "Bed Assigned"
    elif "bed" in dest.lower():
        dept = "Emergency Department"
        bed = dest

    donor_display = donor.user.display_name if (donor and donor.user) else "Verified Donor"
    hospital_title = request.hospital.name if (request and request.hospital) else "Hospital Center"

    return {
        "valid": True,
        "status": "VALID",
        "message": f"QR Pass verified! Donor arrival confirmed for {dest}.",
        "donor_code": donor.donor_code if donor else "DONOR",
        "donor_name": donor_display,
        "blood_group": donor.blood_group if donor else "Unknown",
        "request_id": request.id if request else None,
        "patient_case_ref": request.patient_case_ref if request else None,
        "urgency": request.urgency if request else None,
        "component": request.component if request else None,
        "quantity_required": request.quantity_required if request else 1,
        "destination_dept": dest,
        "department": dept,
        "bed_number": bed,
        "hospital_name": hospital_title,
        "routing_instructions": f"Direct voluntary donor {donor_display} ({donor.donor_code if donor else ''}) directly to {dept}, {bed} for pre-donation screening & transfusion collection."
    }
