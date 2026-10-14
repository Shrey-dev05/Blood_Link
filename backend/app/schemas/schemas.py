from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field

# User & Auth
class UserBase(BaseModel):
    display_name: str
    email: str
    phone: Optional[str] = None
    role: str = "public"
    organization_id: Optional[str] = None

class UserCreate(UserBase):
    password: Optional[str] = "demo123"

class UserResponse(UserBase):
    id: str
    account_status: str
    created_at: datetime

    class Config:
        from_attributes = True

class DemoLoginRequest(BaseModel):
    role: str # hospital_staff, donor, blood_bank_staff, coordinator, organizer, admin, public
    email: Optional[str] = None

# Organization
class OrganizationBase(BaseModel):
    name: str
    type: str # hospital, blood_bank, ngo_organizer
    city: str
    address: str
    latitude: float
    longitude: float
    contact_phone: str
    contact_email: Optional[str] = None
    license_number: Optional[str] = None
    operating_hours: Optional[str] = "24x7 Emergency Services"

class OrganizationResponse(OrganizationBase):
    id: str
    verification_status: str
    created_at: datetime

    class Config:
        from_attributes = True

# Donor Profile
class DonorProfileBase(BaseModel):
    blood_group: str
    city: str
    area: str
    latitude: float
    longitude: float
    opt_in_alerts: bool = True
    map_discoverable: bool = True
    availability_state: str = "available" # available, unavailable, paused

class DonorProfileResponse(DonorProfileBase):
    id: str
    user_id: str
    donor_code: Optional[str]
    blood_group_verified: bool
    availability_confirmed_at: datetime
    total_donations: int
    last_donation_date: Optional[datetime]
    display_name: Optional[str] = None

    class Config:
        from_attributes = True

class DonorAvailabilityUpdate(BaseModel):
    availability_state: str # available, unavailable, paused

class DonorConsentUpdate(BaseModel):
    opt_in_alerts: Optional[bool] = None
    map_discoverable: Optional[bool] = None

# Blood Request
class BloodRequestCreate(BaseModel):
    patient_case_ref: str = Field(..., description="Pseudonymous case reference (no patient names)")
    hospital_id: Optional[str] = Field(None, description="Target hospital ID if specified")
    component: str = Field(..., description="prbc, whole_blood, platelets, ffp")
    blood_group: str = Field(..., description="A+, A-, B+, B-, AB+, AB-, O+, O-")
    quantity_required: int = Field(..., gt=0, le=20)
    urgency: str = Field("P0", description="P0, P1, P2, P3")
    destination_dept: str
    clinical_notes: Optional[str] = None
    due_in_hours: Optional[int] = 3

class RequestEventResponse(BaseModel):
    id: str
    request_id: str
    actor_id: str
    actor_name: str
    previous_state: Optional[str]
    new_state: str
    event_type: str
    reason: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True

class SourceMatchResponse(BaseModel):
    id: str
    request_id: str
    source_type: str # blood_bank or donor
    source_id: str
    source_name: str
    contact_phone: Optional[str]
    distance_km: float
    freshness_status: str
    response_state: str
    units_offered: int
    notes: Optional[str]
    responded_at: Optional[datetime]
    created_at: datetime

    class Config:
        from_attributes = True

class BloodRequestResponse(BaseModel):
    id: str
    hospital_id: str
    hospital_name: Optional[str] = None
    patient_case_ref: str
    component: str
    blood_group: str
    quantity_required: int
    quantity_fulfilled: int
    urgency: str
    status: str
    destination_dept: str
    clinical_notes: Optional[str]
    escalation_stage: str
    due_at: datetime
    created_at: datetime
    events: List[RequestEventResponse] = []
    matches: List[SourceMatchResponse] = []

    class Config:
        from_attributes = True

class EscalateRequestPayload(BaseModel):
    target_stage: str # DISTRICT, STATEWIDE
    reason: str

class CancelRequestPayload(BaseModel):
    reason: str

# Inventory
class InventoryItemBase(BaseModel):
    component: str
    blood_group: str
    units_available: int
    status: str = "CONFIRMED_AVAILABLE"
    storage_temp_celsius: Optional[float] = 4.0

class InventoryItemResponse(InventoryItemBase):
    id: str
    blood_bank_id: str
    blood_bank_name: Optional[str] = None
    units_reserved: int
    last_source_update: datetime
    expiry_date: Optional[datetime]

    class Config:
        from_attributes = True

class InventoryStockUpdate(BaseModel):
    units_available: int
    status: Optional[str] = "CONFIRMED_AVAILABLE"

class InventoryReservePayload(BaseModel):
    request_id: str
    units_to_reserve: int

# QR Pass & Validation
class QRPassResponse(BaseModel):
    id: str
    pass_code: str # Readable pass code e.g. RR-9821
    token: str # Encoded token for QR generator
    donor_id: str
    request_id: str
    facility_id: str
    facility_name: Optional[str] = None
    facility_address: Optional[str] = None
    issued_at: datetime
    expires_at: datetime
    status: str

class QRValidatePayload(BaseModel):
    code_or_token: str
    facility_id: Optional[str] = None

class QRValidateResult(BaseModel):
    valid: bool
    status: str # VALID, EXPIRED, ALREADY_USED, WRONG_FACILITY, NOT_FOUND
    message: str
    donor_code: Optional[str] = None
    donor_name: Optional[str] = None
    blood_group: Optional[str] = None
    request_id: Optional[str] = None
    patient_case_ref: Optional[str] = None
    urgency: Optional[str] = None
    component: Optional[str] = None
    quantity_required: Optional[int] = None
    destination_dept: Optional[str] = None
    department: Optional[str] = None
    bed_number: Optional[str] = None
    hospital_name: Optional[str] = None
    routing_instructions: Optional[str] = None

# Clinical Screening & Outcomes
class ClinicalScreeningPayload(BaseModel):
    donor_id: str
    screening_status: str # ELIGIBLE, DEFERRED_TEMPORARY, DEFERRED_PERMANENT
    notes: Optional[str] = None

class DonationOutcomePayload(BaseModel):
    donor_id: str
    official_unit_barcode: str # Physical blood bag barcode
    units_collected: int = 1
    donation_outcome: str = "COMPLETED" # COMPLETED, INCOMPLETE

class ConfirmFulfillmentPayload(BaseModel):
    status: str # FULFILLED, PARTIALLY_FULFILLED, CLOSED_UNFULFILLED
    units_confirmed: int
    outcome_notes: Optional[str] = None

# Donation Camps
class CampCreate(BaseModel):
    title: str
    description: Optional[str] = None
    venue_address: str
    city: str
    latitude: float
    longitude: float
    start_date: datetime
    end_date: datetime
    target_capacity: int = 100
    contact_phone: str
    partner_blood_bank: Optional[str] = "Red Cross Blood Bank"

class CampResponse(BaseModel):
    id: str
    organizer_id: str
    organizer_name: Optional[str] = None
    title: str
    description: Optional[str]
    venue_address: str
    city: str
    latitude: float
    longitude: float
    start_date: datetime
    end_date: datetime
    target_capacity: int
    registered_count: int
    attended_count: int
    contact_phone: str
    status: str
    partner_blood_bank: str
    created_at: datetime

    class Config:
        from_attributes = True

class CampRegisterPayload(BaseModel):
    donor_id: str

# BloodBuddy Awareness Chat
class ChatMessagePayload(BaseModel):
    message: str
    language: Optional[str] = "en" # en, hi, hinglish

class SourceCitation(BaseModel):
    title: str
    publisher: str
    url: str

class ChatResponse(BaseModel):
    answer: str
    language: str
    is_medical_refusal: bool = False
    citations: List[SourceCitation] = []
    suggestions: List[str] = []

# Notification
class NotificationResponse(BaseModel):
    id: str
    user_id: str
    request_id: Optional[str]
    title: str
    body: str
    priority: str
    channel: str
    status: str
    created_at: datetime

    class Config:
        from_attributes = True

# Audit Log
class AuditLogResponse(BaseModel):
    id: str
    actor_id: str
    actor_role: str
    action: str
    entity_type: str
    entity_id: str
    details: Optional[str]
    timestamp: datetime

    class Config:
        from_attributes = True

# Donor Registration & Sign-In
class DonorRegisterRequest(BaseModel):
    display_name: str
    phone: str
    email: Optional[str] = None
    blood_group: str
    city: str
    area: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    opt_in_alerts: bool = True
    map_discoverable: bool = True

class DonorLoginRequest(BaseModel):
    identifier: str # phone, email, or donor_code

class DonorAuthResponse(BaseModel):
    user_id: str
    donor_id: str
    donor_code: str
    display_name: str
    phone: Optional[str] = None
    email: Optional[str] = None
    blood_group: str
    city: str
    area: str
    availability_state: str
    opt_in_alerts: bool
    map_discoverable: bool
    total_donations: int
    message: str

