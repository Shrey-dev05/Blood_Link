from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.entities import AuditLog, Organization, User, BloodRequest
from app.schemas.schemas import AuditLogResponse, OrganizationResponse
from app.services.audit_service import log_audit_event

router = APIRouter(prefix="/admin", tags=["Platform Administration"])

@router.get("/audit-logs", response_model=List[AuditLogResponse])
def get_audit_logs(
    action: Optional[str] = None,
    limit: int = 50,
    db: Session = Depends(get_db)
):
    query = db.query(AuditLog).order_by(AuditLog.timestamp.desc())
    if action:
        query = query.filter(AuditLog.action == action)
    return query.limit(limit).all()

@router.get("/organizations", response_model=List[OrganizationResponse])
def get_all_organizations(db: Session = Depends(get_db)):
    return db.query(Organization).order_by(Organization.created_at.desc()).all()

@router.post("/organizations/{org_id}/verify", response_model=OrganizationResponse)
def verify_organization(
    org_id: str,
    status: str = "verified", # verified, rejected, suspended
    db: Session = Depends(get_db)
):
    org = db.query(Organization).filter(Organization.id == org_id).first()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")

    org.verification_status = status
    db.commit()

    log_audit_event(
        db=db,
        actor_id="admin-01",
        actor_role="admin",
        action="VERIFY_ORGANIZATION",
        entity_type="Organization",
        entity_id=org.id,
        details=f"Status set to {status}"
    )

    return org

@router.get("/data-sources")
def get_data_sources_status():
    # As mandated by specification: transparently show real, simulated or demo status
    return [
        {
            "source_name": "e-RaktKosh Directory Adapter",
            "type": "Government Blood Portal Sync",
            "status": "SIMULATED / DEMO MODE",
            "last_sync": datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC"),
            "records_imported": 24,
            "provenance": "Synthetic National Blood Center fixtures for testing",
            "credentials_configured": False,
            "note": "Official e-RaktKosh API credentials pending institutional onboarding."
        },
        {
            "source_name": "ABDM / ABHA Health ID Gateway",
            "type": "National Health Authority Identity",
            "status": "NOT CONFIGURED / SAFEGUARDED",
            "last_sync": "N/A",
            "records_imported": 0,
            "provenance": "No mock ABHA stored per privacy specification",
            "credentials_configured": False,
            "note": "Individual health identity sandbox integration awaiting sandbox consent."
        },
        {
            "source_name": "FCM Push & Web Notification Worker",
            "type": "Push Notification Service",
            "status": "IN-APP FALLBACK ACTIVE",
            "last_sync": datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC"),
            "records_imported": 0,
            "provenance": "In-app alert store active for demo",
            "credentials_configured": False,
            "note": "Browser notification permission supported; in-app inbox is authoritative."
        }
    ]
