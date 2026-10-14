import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, Text, ForeignKey, Enum
from sqlalchemy.orm import relationship
from app.database import Base

def generate_uuid():
    return str(uuid.uuid4())

class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    auth_provider_uid = Column(String(128), unique=True, index=True, nullable=True)
    display_name = Column(String(100), nullable=False)
    email = Column(String(120), unique=True, index=True, nullable=False)
    phone = Column(String(20), nullable=True)
    role = Column(String(30), nullable=False, default="public") # hospital_staff, donor, blood_bank_staff, coordinator, organizer, admin, public
    organization_id = Column(String(36), ForeignKey("organizations.id"), nullable=True)
    account_status = Column(String(20), default="active") # active, pending, suspended
    created_at = Column(DateTime, default=datetime.utcnow)

    organization = relationship("Organization", back_populates="staff_members")
    donor_profile = relationship("DonorProfile", back_populates="user", uselist=False)
    notifications = relationship("Notification", back_populates="user")


class Organization(Base):
    __tablename__ = "organizations"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(150), nullable=False)
    type = Column(String(30), nullable=False) # hospital, blood_bank, ngo_organizer
    verification_status = Column(String(20), default="verified") # verified, pending, rejected, suspended
    license_number = Column(String(100), nullable=True)
    city = Column(String(100), nullable=False)
    address = Column(String(255), nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    contact_phone = Column(String(30), nullable=False)
    contact_email = Column(String(100), nullable=True)
    operating_hours = Column(String(100), default="24x7 Emergency Services")
    created_at = Column(DateTime, default=datetime.utcnow)

    staff_members = relationship("User", back_populates="organization")
    blood_requests = relationship("BloodRequest", back_populates="hospital")
    inventory_items = relationship("InventoryItem", back_populates="blood_bank")
    camps = relationship("Camp", back_populates="organizer")


class DonorProfile(Base):
    __tablename__ = "donor_profiles"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id"), unique=True, nullable=False)
    donor_code = Column(String(20), unique=True, index=True) # e.g. DONOR-1042
    blood_group = Column(String(10), nullable=False) # A+, A-, B+, B-, AB+, AB-, O+, O-
    blood_group_verified = Column(Boolean, default=True)
    city = Column(String(100), nullable=False)
    area = Column(String(100), nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    opt_in_alerts = Column(Boolean, default=True)
    map_discoverable = Column(Boolean, default=True)
    availability_state = Column(String(30), default="available") # available, unavailable, paused
    availability_confirmed_at = Column(DateTime, default=datetime.utcnow)
    total_donations = Column(Integer, default=0)
    last_donation_date = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="donor_profile")
    qr_passes = relationship("QRPass", back_populates="donor")
    donation_events = relationship("DonationEvent", back_populates="donor")
    camp_registrations = relationship("CampRegistration", back_populates="donor")


class BloodRequest(Base):
    __tablename__ = "blood_requests"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    hospital_id = Column(String(36), ForeignKey("organizations.id"), nullable=False)
    created_by_user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    patient_case_ref = Column(String(50), nullable=False) # Pseudonymous ID e.g. CASE-9041
    component = Column(String(30), nullable=False) # prbc, whole_blood, platelets, ffp
    blood_group = Column(String(10), nullable=False) # O+, O-, etc.
    quantity_required = Column(Integer, nullable=False) # e.g. 2 units
    quantity_fulfilled = Column(Integer, default=0)
    urgency = Column(String(10), default="P0") # P0 (Immediate), P1 (Same day), P2 (Scheduled), P3 (Routine)
    status = Column(String(35), default="MATCHING") 
    # DRAFT, SUBMITTED, VERIFIED, MATCHING, AWAITING_CONFIRMATION, SOURCE_CONFIRMED, FULFILLMENT_IN_PROGRESS, PARTIALLY_FULFILLED, FULFILLED, CANCELLED, EXPIRED
    destination_dept = Column(String(100), nullable=False)
    clinical_notes = Column(Text, nullable=True)
    escalation_stage = Column(String(30), default="LOCAL") # LOCAL, DISTRICT, STATEWIDE
    due_at = Column(DateTime, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    hospital = relationship("Organization", back_populates="blood_requests")
    events = relationship("RequestEvent", back_populates="request", order_by="RequestEvent.created_at")
    matches = relationship("SourceMatch", back_populates="request")
    qr_passes = relationship("QRPass", back_populates="request")
    donation_events = relationship("DonationEvent", back_populates="request")


class RequestEvent(Base):
    __tablename__ = "request_events"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    request_id = Column(String(36), ForeignKey("blood_requests.id"), nullable=False)
    actor_id = Column(String(36), nullable=False)
    actor_name = Column(String(100), nullable=False)
    previous_state = Column(String(35), nullable=True)
    new_state = Column(String(35), nullable=False)
    event_type = Column(String(50), nullable=False) # CREATED, MATCH_STARTED, SOURCE_CONFIRMED, ESCALATED, QR_SCANNED, CLINICAL_OUTCOME, FULFILLED, CANCELLED
    reason = Column(String(255), nullable=True)
    metadata_json = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    request = relationship("BloodRequest", back_populates="events")


class InventoryItem(Base):
    __tablename__ = "inventory_items"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    blood_bank_id = Column(String(36), ForeignKey("organizations.id"), nullable=False)
    component = Column(String(30), nullable=False) # whole_blood, prbc, platelets, ffp
    blood_group = Column(String(10), nullable=False)
    units_available = Column(Integer, default=0)
    units_reserved = Column(Integer, default=0)
    status = Column(String(30), default="CONFIRMED_AVAILABLE") # CONFIRMED_AVAILABLE, REPORTED_UNVERIFIED, STALE, RESERVED, EXPIRED
    last_source_update = Column(DateTime, default=datetime.utcnow)
    expiry_date = Column(DateTime, nullable=True)
    storage_temp_celsius = Column(Float, default=4.0)

    blood_bank = relationship("Organization", back_populates="inventory_items")


class SourceMatch(Base):
    __tablename__ = "source_matches"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    request_id = Column(String(36), ForeignKey("blood_requests.id"), nullable=False)
    source_type = Column(String(20), nullable=False) # blood_bank or donor
    source_id = Column(String(36), nullable=False) # blood_bank_id or donor_profile_id
    source_name = Column(String(150), nullable=False)
    contact_phone = Column(String(30), nullable=True)
    distance_km = Column(Float, default=0.0)
    freshness_status = Column(String(30), default="CONFIRMED") # CONFIRMED, STALE, UNVERIFIED
    response_state = Column(String(35), default="NOTIFIED") 
    # NOTIFIED, DELIVERED, ACCEPTED, DECLINED, TRAVELLING, ARRIVED_QR_VERIFIED, CONFIRMED_AVAILABLE, EXPIRED
    units_offered = Column(Integer, default=1)
    notes = Column(String(255), nullable=True)
    responded_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    request = relationship("BloodRequest", back_populates="matches")


class QRPass(Base):
    __tablename__ = "qr_passes"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    token_hash = Column(String(128), unique=True, index=True, nullable=False)
    pass_code = Column(String(16), unique=True, index=True, nullable=False) # e.g. RR-9821
    donor_id = Column(String(36), ForeignKey("donor_profiles.id"), nullable=False)
    request_id = Column(String(36), ForeignKey("blood_requests.id"), nullable=False)
    facility_id = Column(String(36), ForeignKey("organizations.id"), nullable=False)
    issued_at = Column(DateTime, default=datetime.utcnow)
    expires_at = Column(DateTime, nullable=False)
    used_at = Column(DateTime, nullable=True)
    revoked_at = Column(DateTime, nullable=True)
    status = Column(String(20), default="ISSUED") # ISSUED, VALIDATED, USED, EXPIRED, REVOKED

    donor = relationship("DonorProfile", back_populates="qr_passes")
    request = relationship("BloodRequest", back_populates="qr_passes")


class DonationEvent(Base):
    __tablename__ = "donation_events"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    donor_id = Column(String(36), ForeignKey("donor_profiles.id"), nullable=False)
    request_id = Column(String(36), ForeignKey("blood_requests.id"), nullable=False)
    facility_id = Column(String(36), ForeignKey("organizations.id"), nullable=False)
    verified_by_user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    arrival_verified_at = Column(DateTime, default=datetime.utcnow)
    screening_status = Column(String(30), default="ELIGIBLE") # ELIGIBLE, DEFERRED_TEMPORARY, DEFERRED_PERMANENT
    screening_notes = Column(String(255), nullable=True)
    donation_outcome = Column(String(30), default="COMPLETED") # COMPLETED, INCOMPLETE, CANCELLED
    official_unit_barcode = Column(String(64), nullable=True) # Official blood bank bag ID
    units_collected = Column(Integer, default=1)
    recorded_at = Column(DateTime, default=datetime.utcnow)

    donor = relationship("DonorProfile", back_populates="donation_events")
    request = relationship("BloodRequest", back_populates="donation_events")


class Camp(Base):
    __tablename__ = "camps"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    organizer_id = Column(String(36), ForeignKey("organizations.id"), nullable=False)
    title = Column(String(150), nullable=False)
    description = Column(Text, nullable=True)
    venue_address = Column(String(255), nullable=False)
    city = Column(String(100), nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    start_date = Column(DateTime, nullable=False)
    end_date = Column(DateTime, nullable=False)
    target_capacity = Column(Integer, default=100)
    registered_count = Column(Integer, default=0)
    attended_count = Column(Integer, default=0)
    contact_phone = Column(String(30), nullable=False)
    status = Column(String(20), default="PUBLISHED") # PUBLISHED, DRAFT, COMPLETED, CANCELLED
    partner_blood_bank = Column(String(120), default="Red Cross Blood Bank")
    created_at = Column(DateTime, default=datetime.utcnow)

    organizer = relationship("Organization", back_populates="camps")
    registrations = relationship("CampRegistration", back_populates="camp")


class CampRegistration(Base):
    __tablename__ = "camp_registrations"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    camp_id = Column(String(36), ForeignKey("camps.id"), nullable=False)
    donor_id = Column(String(36), ForeignKey("donor_profiles.id"), nullable=False)
    registration_code = Column(String(20), unique=True, index=True) # e.g. CAMP-5421
    status = Column(String(20), default="REGISTERED") # REGISTERED, ATTENDED, CANCELLED
    registered_at = Column(DateTime, default=datetime.utcnow)
    attended_at = Column(DateTime, nullable=True)

    camp = relationship("Camp", back_populates="registrations")
    donor = relationship("DonorProfile", back_populates="camp_registrations")


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    request_id = Column(String(36), nullable=True)
    title = Column(String(150), nullable=False)
    body = Column(Text, nullable=False)
    priority = Column(String(10), default="P0") # P0, P1, P2
    channel = Column(String(20), default="IN_APP") # IN_APP, FCM_PUSH, SMS
    status = Column(String(20), default="DELIVERED") # DELIVERED, READ, PENDING, FAILED
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="notifications")


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    actor_id = Column(String(36), nullable=False)
    actor_role = Column(String(30), nullable=False)
    action = Column(String(60), nullable=False) # REQUEST_CREATED, MATCH_INITIATED, QR_VERIFIED, STOCK_RESERVED, etc.
    entity_type = Column(String(30), nullable=False)
    entity_id = Column(String(36), nullable=False)
    details = Column(Text, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
