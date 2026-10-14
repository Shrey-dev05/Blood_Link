from datetime import datetime
from sqlalchemy.orm import Session
from app.models.entities import AuditLog

def log_audit_event(
    db: Session,
    actor_id: str,
    actor_role: str,
    action: str,
    entity_type: str,
    entity_id: str,
    details: str = None
):
    log = AuditLog(
        actor_id=actor_id,
        actor_role=actor_role,
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        details=details,
        timestamp=datetime.utcnow()
    )
    db.add(log)
    db.commit()
    return log
