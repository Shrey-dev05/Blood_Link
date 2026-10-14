import urllib.request
import json

def test():
    # 1. Fetch current requests count
    r1 = urllib.request.urlopen("http://127.0.0.1:8000/api/v1/requests")
    before_reqs = json.loads(r1.read())
    print("Initial requests count:", len(before_reqs))

    # 2. Hospital creates a new request
    payload = json.dumps({
        "patient_case_ref": "TEST-ICU-7721",
        "component": "prbc",
        "blood_group": "O-",
        "quantity_required": 2,
        "urgency": "P0",
        "destination_dept": "ICU Bay 4 Resuscitation",
        "clinical_notes": "Urgent O- needed for emergency surgery",
        "due_in_hours": 2
    }).encode("utf-8")

    req_create = urllib.request.Request(
        "http://127.0.0.1:8000/api/v1/requests",
        data=payload,
        headers={"Content-Type": "application/json", "x-user-role": "hospital_staff"}
    )
    with urllib.request.urlopen(req_create) as resp:
        new_req = json.loads(resp.read().decode())
    req_id = new_req["id"]
    print("Created new request:", req_id, new_req["patient_case_ref"], new_req["blood_group"], "Hospital:", new_req["hospital_name"])

    # 3. Check Donor Inbox - Does this request show up?
    r_inbox = urllib.request.urlopen("http://127.0.0.1:8000/api/v1/donors/requests/inbox")
    inbox = json.loads(r_inbox.read())
    print("Donor inbox count:", len(inbox))
    found = [i for i in inbox if i["request_id"] == req_id]
    print("New request found in donor inbox?", len(found) > 0)
    if found:
        print("  Inbox item:", found[0]["patient_case_ref"], found[0]["hospital_name"], found[0]["response_state"])

    # 4. Donor accepts the request
    r_accept = urllib.request.Request(
        f"http://127.0.0.1:8000/api/v1/donors/requests/{req_id}/respond?action=accept",
        data=b"",
        headers={"Content-Type": "application/json"}
    )
    with urllib.request.urlopen(r_accept) as resp:
        accept_res = json.loads(resp.read().decode())
    pass_code = accept_res.get("pass_code")
    print("Donor accept response:", accept_res["status"], "Generated Pass Code:", pass_code)

    # 5. Hospital scans and validates the QR code pass
    validate_payload = json.dumps({"code_or_token": pass_code}).encode("utf-8")
    r_val = urllib.request.Request(
        "http://127.0.0.1:8000/api/v1/qr/validate",
        data=validate_payload,
        headers={"Content-Type": "application/json"}
    )
    with urllib.request.urlopen(r_val) as resp:
        val_res = json.loads(resp.read().decode())
    print("Hospital QR Scan result:", val_res["valid"], val_res["message"], "Donor Code:", val_res.get("donor_code"))

    # 6. Verify request state is now updated in hospital command center
    r_check = urllib.request.urlopen(f"http://127.0.0.1:8000/api/v1/requests/{req_id}")
    req_updated = json.loads(r_check.read())
    print("Updated request status:", req_updated["status"])
    print("Matches states:", [(m["source_type"], m["source_name"], m["response_state"]) for m in req_updated["matches"]])

if __name__ == "__main__":
    test()
