export type UserRole = 
  | 'hospital_staff' 
  | 'donor' 
  | 'blood_bank_staff' 
  | 'coordinator' 
  | 'organizer' 
  | 'admin' 
  | 'public';

export interface User {
  id: string;
  display_name: string;
  email: string;
  phone?: string;
  role: UserRole;
  organization_id?: string;
  account_status: string;
}

export interface Organization {
  id: string;
  name: string;
  type: 'hospital' | 'blood_bank' | 'ngo_organizer';
  verification_status: string;
  license_number?: string;
  city: string;
  address: string;
  latitude: number;
  longitude: number;
  contact_phone: string;
  contact_email?: string;
  operating_hours?: string;
}

export interface DonorProfile {
  id: string;
  user_id: string;
  display_name?: string;
  donor_code: string;
  blood_group: string;
  blood_group_verified: boolean;
  city: string;
  area: string;
  latitude: number;
  longitude: number;
  opt_in_alerts: boolean;
  map_discoverable: boolean;
  availability_state: 'available' | 'unavailable' | 'paused';
  total_donations: number;
  last_donation_date?: string;
}

export interface RequestEvent {
  id: string;
  request_id: string;
  actor_name: string;
  previous_state?: string;
  new_state: string;
  event_type: string;
  reason?: string;
  created_at: string;
}

export interface SourceMatch {
  id: string;
  request_id: string;
  source_type: 'blood_bank' | 'donor';
  source_id: string;
  source_name: string;
  contact_phone?: string;
  distance_km: number;
  freshness_status: string;
  response_state: string;
  units_offered: number;
  notes?: string;
  responded_at?: string;
  created_at: string;
}

export interface BloodRequest {
  id: string;
  hospital_id: string;
  hospital_name?: string;
  patient_case_ref: string;
  component: string;
  blood_group: string;
  quantity_required: number;
  quantity_fulfilled: number;
  urgency: 'P0' | 'P1' | 'P2' | 'P3';
  status: string;
  destination_dept: string;
  clinical_notes?: string;
  escalation_stage: 'LOCAL' | 'DISTRICT' | 'STATEWIDE';
  due_at: string;
  created_at: string;
  events: RequestEvent[];
  matches: SourceMatch[];
}

export interface InventoryItem {
  id: string;
  blood_bank_id: string;
  blood_bank_name?: string;
  component: string;
  blood_group: string;
  units_available: number;
  units_reserved: number;
  status: 'CONFIRMED_AVAILABLE' | 'REPORTED_UNVERIFIED' | 'STALE' | 'RESERVED' | 'EXPIRED';
  last_source_update: string;
  expiry_date?: string;
}

export interface Camp {
  id: string;
  organizer_id: string;
  organizer_name?: string;
  title: string;
  description?: string;
  venue_address: string;
  city: string;
  latitude: number;
  longitude: number;
  start_date: string;
  end_date: string;
  target_capacity: number;
  registered_count: number;
  attended_count: number;
  contact_phone: string;
  status: string;
  partner_blood_bank: string;
}

export interface SourceCitation {
  title: string;
  publisher: string;
  url: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'bloodbuddy';
  text: string;
  citations?: SourceCitation[];
  isMedicalRefusal?: boolean;
  timestamp: string;
}
