import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.database import Base, engine, SessionLocal
from app.seed import seed_database

client = TestClient(app)

@pytest.fixture(scope="module", autouse=True)
def setup_test_db():
    seed_database()

def test_health():
    res = client.get("/health")
    assert res.status_code == 200
    assert res.json()["status"] == "healthy"

def test_list_blood_banks():
    res = client.get("/api/v1/blood-banks")
    assert res.status_code == 200
    data = res.json()
    assert len(data) >= 3

def test_bloodbuddy_faq_and_medical_safety():
    # Test normal FAQ query
    res = client.post("/api/v1/awareness-chat/message", json={"message": "Does donating blood cause weakness?", "language": "en"})
    assert res.status_code == 200
    data = res.json()
    assert data["is_medical_refusal"] is False
    assert "plasma" in data["answer"].lower()
    assert len(data["citations"]) > 0

    # Test medical symptom refusal
    res_med = client.post("/api/v1/awareness-chat/message", json={"message": "I have severe chest pain and fever, can I donate?", "language": "en"})
    assert res_med.status_code == 200
    data_med = res_med.json()
    assert data_med["is_medical_refusal"] is True
    assert "physician" in data_med["answer"].lower()

def test_create_request_and_parallel_matching():
    payload = {
        "patient_case_ref": "TEST-SURGERY-101",
        "component": "prbc",
        "blood_group": "O-",
        "quantity_required": 2,
        "urgency": "P0",
        "destination_dept": "Cardiac OT",
        "clinical_notes": "Emergency CABG with acute blood loss",
        "due_in_hours": 2
    }
    res = client.post("/api/v1/requests", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["patient_case_ref"] == "TEST-SURGERY-101"
    assert data["urgency"] == "P0"
    assert data["status"] == "MATCHING"
    # Verify parallel matches generated
    assert len(data["matches"]) >= 1

def test_qr_generation_and_validation():
    # Donor inbox
    inbox_res = client.get("/api/v1/donors/requests/inbox")
    assert inbox_res.status_code == 200
    inbox = inbox_res.json()
    assert len(inbox) >= 1
    req_id = inbox[0]["request_id"]

    # Accept request
    accept_res = client.post(f"/api/v1/donors/requests/{req_id}/respond?action=accept")
    assert accept_res.status_code == 200
    pass_code = accept_res.json()["pass_code"]
    assert pass_code.startswith("RR-")

    # Validate QR pass at facility
    val_res = client.post("/api/v1/qr/validate", json={"code_or_token": pass_code})
    assert val_res.status_code == 200
    val_data = val_res.json()
    assert val_data["valid"] is True
    assert val_data["status"] == "VALID"

    # Replay / Re-use attempt must fail!
    replay_res = client.post("/api/v1/qr/validate", json={"code_or_token": pass_code})
    assert replay_res.status_code == 200
    assert replay_res.json()["valid"] is False
    assert replay_res.json()["status"] == "ALREADY_USED"

def test_privacy_on_map():
    # Public role cannot access donor coverage
    pub_res = client.get("/api/v1/map/donor-coverage", headers={"x-user-role": "public"})
    assert pub_res.status_code == 200
    assert pub_res.json()["access_allowed"] is False

    # Hospital staff can view approximate clusters
    hosp_res = client.get("/api/v1/map/donor-coverage", headers={"x-user-role": "hospital_staff"})
    assert hosp_res.status_code == 200
    assert hosp_res.json()["access_allowed"] is True
    assert len(hosp_res.json()["clusters"]) > 0
