const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api/v1';


async function fetchJSON(endpoint: string, options: RequestInit = {}) {
  const currentRole = typeof window !== 'undefined' ? (localStorage.getItem('bloodlink_role') || localStorage.getItem('raktareach_role') || 'hospital_staff') : 'hospital_staff';
  const currentDonorId = typeof window !== 'undefined' ? (localStorage.getItem('bloodlink_donor_id') || localStorage.getItem('raktareach_donor_id') || '') : '';

  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'x-user-role': currentRole,
    ...(currentDonorId ? { 'x-donor-id': currentDonorId } : {}),
    ...((options.headers as Record<string, string>) || {})
  };

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers
  });


  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    const message = errorData.detail || errorData.error?.message || `Request failed: ${res.status}`;
    throw new Error(message);
  }

  return res.json();
}

export const api = {
  // Auth & Roles
  demoLogin: (role: string) => fetchJSON('/auth/demo-login', {
    method: 'POST',
    body: JSON.stringify({ role })
  }),
  getCurrentUser: () => fetchJSON('/auth/me'),
  getDemoUsers: () => fetchJSON('/auth/users'),

  // Requests
  getRequests: (params?: { urgency?: string; status?: string }) => {
    const q = new URLSearchParams(params as any).toString();
    return fetchJSON(`/requests${q ? `?${q}` : ''}`);
  },
  getRequestById: (id: string) => fetchJSON(`/requests/${id}`),
  createRequest: (data: any) => fetchJSON('/requests', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  escalateRequest: (id: string, targetStage: string, reason: string) => fetchJSON(`/requests/${id}/escalate`, {
    method: 'POST',
    body: JSON.stringify({ target_stage: targetStage, reason })
  }),
  cancelRequest: (id: string, reason: string) => fetchJSON(`/requests/${id}/cancel`, {
    method: 'POST',
    body: JSON.stringify({ reason })
  }),
  confirmFulfillment: (id: string, units: number, notes?: string) => fetchJSON(`/requests/${id}/confirm-fulfillment`, {
    method: 'POST',
    body: JSON.stringify({ status: 'FULFILLED', units_confirmed: units, outcome_notes: notes })
  }),

  // Donors
  registerDonor: (data: any) => fetchJSON('/auth/donor/register', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  loginDonor: (identifier: string) => fetchJSON('/auth/donor/login', {
    method: 'POST',
    body: JSON.stringify({ identifier })
  }),
  getDonorProfile: (donorId?: string) => fetchJSON(`/donors/me${donorId ? `?donor_id=${donorId}` : ''}`),
  updateDonorAvailability: (state: string) => fetchJSON('/donors/me/availability', {
    method: 'POST',
    body: JSON.stringify({ availability_state: state })
  }),
  updateDonorConsent: (consent: { opt_in_alerts?: boolean; map_discoverable?: boolean }) => fetchJSON('/donors/me/consent', {
    method: 'POST',
    body: JSON.stringify(consent)
  }),
  getDonorInbox: (donorId?: string) => fetchJSON(`/donors/requests/inbox${donorId ? `?donor_id=${donorId}` : ''}`),
  respondToRequest: (requestId: string, action: 'accept' | 'decline', donorId?: string) => fetchJSON(`/donors/requests/${requestId}/respond?action=${action}${donorId ? `&donor_id=${donorId}` : ''}`, {
    method: 'POST'
  }),
  markTravelling: (requestId: string) => fetchJSON(`/donors/requests/${requestId}/travel`, {
    method: 'POST'
  }),


  // Blood Banks & Inventory
  getBloodBanks: () => fetchJSON('/blood-banks'),
  getBankInventory: (bankId: string) => fetchJSON(`/blood-banks/${bankId}/inventory`),
  getBankIncomingRequests: (bankId: string) => fetchJSON(`/blood-banks/${bankId}/incoming-requests`),
  respondBloodBankRequest: (bankId: string, requestId: string, action: 'accept' | 'decline', units?: number) => fetchJSON(`/blood-banks/${bankId}/requests/${requestId}/respond?action=${action}${units ? `&units=${units}` : ''}`, {
    method: 'POST'
  }),
  updateInventoryStock: (itemId: string, units: number, status?: string) => fetchJSON(`/blood-banks/inventory/${itemId}`, {
    method: 'PATCH',
    body: JSON.stringify({ units_available: units, status })
  }),
  reserveInventory: (itemId: string, requestId: string, units: number) => fetchJSON(`/blood-banks/inventory/${itemId}/reserve`, {
    method: 'POST',
    body: JSON.stringify({ request_id: requestId, units_to_reserve: units })
  }),

  // QR & Donation Events
  validateQR: (codeOrToken: string, facilityId?: string) => fetchJSON('/qr/validate', {
    method: 'POST',
    body: JSON.stringify({ code_or_token: codeOrToken, facility_id: facilityId })
  }),
  getDonationPass: (donorId: string, requestId: string, facilityId: string) => fetchJSON(`/donations/pass?donor_id=${donorId}&request_id=${requestId}&facility_id=${facilityId}`, {
    method: 'POST'
  }),
  recordScreening: (requestId: string, donorId: string, status: string, notes?: string) => fetchJSON(`/donations/screening?request_id=${requestId}`, {
    method: 'POST',
    body: JSON.stringify({ donor_id: donorId, screening_status: status, notes })
  }),
  recordDonationOutcome: (requestId: string, donorId: string, barcode: string, units: number = 1) => fetchJSON(`/donations/outcome?request_id=${requestId}`, {
    method: 'POST',
    body: JSON.stringify({ donor_id: donorId, official_unit_barcode: barcode, units_collected: units, donation_outcome: 'COMPLETED' })
  }),

  // Camps
  getCamps: (city?: string) => fetchJSON(`/camps${city ? `?city=${encodeURIComponent(city)}` : ''}`),
  createCamp: (data: any) => fetchJSON('/camps', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  registerForCamp: (campId: string, donorId: string) => fetchJSON(`/camps/${campId}/register`, {
    method: 'POST',
    body: JSON.stringify({ donor_id: donorId })
  }),
  checkInCampAttendee: (campId: string, code: string) => fetchJSON(`/camps/${campId}/check-in?registration_code=${encodeURIComponent(code)}`, {
    method: 'POST'
  }),

  // Map & Privacy
  getMapFacilities: () => fetchJSON('/map/facilities'),
  getDonorCoverage: () => fetchJSON('/map/donor-coverage'),

  // Coordinator
  getCoordinatorQueue: () => fetchJSON('/coordinator/queue'),
  getCoordinatorStats: () => fetchJSON('/coordinator/stats'),

  // BloodBuddy Chatbot
  sendChatMessage: (message: string, language: string = 'en') => fetchJSON('/awareness-chat/message', {
    method: 'POST',
    body: JSON.stringify({ message, language })
  }),
  getChatSuggestions: () => fetchJSON('/awareness-chat/suggestions'),

  // Admin
  getAuditLogs: (action?: string) => fetchJSON(`/admin/audit-logs${action ? `?action=${action}` : ''}`),
  getAllOrganizations: () => fetchJSON('/admin/organizations'),
  verifyOrganization: (orgId: string, status: string) => fetchJSON(`/admin/organizations/${orgId}/verify?status=${status}`, {
    method: 'POST'
  }),
  getDataSourcesStatus: () => fetchJSON('/admin/data-sources')
};
