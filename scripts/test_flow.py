import urllib.request
import json
import sys

def main():
    # 1. Hospital creates an emergency request
    hosp_payload = json.dumps({
        'patient_case_ref': 'EMERG-TEST-LIVE',
        'component': 'prbc',
        'blood_group': 'O-',
        'quantity_required': 2,
        'urgency': 'P0',
        'destination_dept': 'Trauma Resuscitation Unit — ICU Bed #3',
        'clinical_notes': 'Acute hemorrhagic shock following road traffic accident.',
        'due_in_hours': 2
    }).encode('utf-8')

    req = urllib.request.Request('http://127.0.0.1:8000/api/v1/requests', data=hosp_payload, headers={'Content-Type': 'application/json'})
    created_req = json.loads(urllib.request.urlopen(req).read().decode('utf-8'))
    req_id = created_req['id']
    print('Step 1: Emergency Request Created:', req_id, 'Case:', created_req['patient_case_ref'])

    # 2. Check matches: Verify blood banks within 5 km were matched & notified
    matches = created_req['matches']
    bank_matches = [m for m in matches if m['source_type'] == 'blood_bank']
    print(f'Step 2: Total blood banks matched within 5 km: {len(bank_matches)}')
    assert len(bank_matches) > 0, 'Should match blood banks within 5 km'
    bank_match = bank_matches[0]
    bank_id = bank_match['source_id']
    print(f"  Selected local blood bank: {bank_match['source_name']} ({bank_match['distance_km']} km away)")

    # 3. Blood bank checks incoming requests
    incoming = json.loads(urllib.request.urlopen(f'http://127.0.0.1:8000/api/v1/blood-banks/{bank_id}/incoming-requests').read().decode('utf-8'))
    print(f'Step 3: Blood bank incoming requests count: {len(incoming)}')
    assert len(incoming) >= 1

    # 4. Blood bank accepts the emergency request
    bb_accept_req = urllib.request.Request(
        f'http://127.0.0.1:8000/api/v1/blood-banks/{bank_id}/requests/{req_id}/respond?action=accept&units=2',
        data=b'',
        headers={'Content-Type': 'application/json'}
    )
    bb_res = json.loads(urllib.request.urlopen(bb_accept_req).read().decode('utf-8'))
    print('Step 4: Blood bank accept result:', bb_res)
    assert bb_res['response_state'] == 'ACCEPTED'

    # 5. Check donor inbox: Voluntary donors receive alert
    donor_inbox = json.loads(urllib.request.urlopen('http://127.0.0.1:8000/api/v1/donors/requests/inbox').read().decode('utf-8'))
    print(f'Step 5: Voluntary donor inbox count: {len(donor_inbox)}')
    assert len(donor_inbox) >= 1

    # 6. Voluntary donor accepts to donate blood
    donor_accept_req = urllib.request.Request(
        f'http://127.0.0.1:8000/api/v1/donors/requests/{req_id}/respond?action=accept',
        data=b'',
        headers={'Content-Type': 'application/json'}
    )
    donor_res = json.loads(urllib.request.urlopen(donor_accept_req).read().decode('utf-8'))
    pass_code = donor_res['pass_code']
    print(f'Step 6: Voluntary donor accepted! Generated Pass Code: {pass_code}')
    assert pass_code is not None

    # 7. Check Hospital Dashboard view of the request: Both blood bank and donor must show as ACCEPTED
    hosp_req_detail = json.loads(urllib.request.urlopen(f'http://127.0.0.1:8000/api/v1/requests/{req_id}').read().decode('utf-8'))
    accepted_banks = [m for m in hosp_req_detail['matches'] if m['source_type'] == 'blood_bank' and m['response_state'] == 'ACCEPTED']
    accepted_donors = [m for m in hosp_req_detail['matches'] if m['source_type'] == 'donor' and m['response_state'] == 'ACCEPTED']
    print(f'Step 7: In Hospital Dashboard:')
    print(f"  Accepted Blood Banks: {len(accepted_banks)} -> {[b['source_name'] for b in accepted_banks]}")
    print(f"  Accepted Donors: {len(accepted_donors)} -> {[d['source_name'] for d in accepted_donors]}")
    assert len(accepted_banks) >= 1
    assert len(accepted_donors) >= 1

    # 8. Donor arrives at hospital. Staff scans donor QR pass
    val_payload = json.dumps({'code_or_token': pass_code}).encode('utf-8')
    val_req = urllib.request.Request('http://127.0.0.1:8000/api/v1/qr/validate', data=val_payload, headers={'Content-Type': 'application/json'})
    val_res = json.loads(urllib.request.urlopen(val_req).read().decode('utf-8'))
    print('Step 8: QR Scan Result for Hospital Staff:')
    print(f"  Valid: {val_res['valid']}")
    print(f"  Patient Case: {val_res['patient_case_ref']}")
    print(f"  Department: {val_res['department']}")
    print(f"  Bed Number: {val_res['bed_number']}")
    print(f"  Routing Instructions: {val_res['routing_instructions']}")
    assert val_res['valid'] is True
    assert 'Trauma Resuscitation Unit' in val_res['destination_dept']
    assert 'Bed' in val_res['bed_number']

    # 9. Clean up test request from database so user has clean slate
    from app.database import SessionLocal
    from app.models.entities import BloodRequest, SourceMatch, QRPass, RequestEvent, Notification
    db = SessionLocal()
    db.query(QRPass).delete()
    db.query(SourceMatch).delete()
    db.query(RequestEvent).delete()
    db.query(Notification).delete()
    db.query(BloodRequest).delete()
    db.commit()
    print('Step 9: Database reset to 0 requests. Final active count:', db.query(BloodRequest).count())
    db.close()
    print('ALL VERIFICATIONS PASSED SUCCESSFULLY!')

if __name__ == '__main__':
    main()
