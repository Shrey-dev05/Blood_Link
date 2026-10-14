import urllib.request
import json

def check():
    r = urllib.request.urlopen("http://127.0.0.1:8000/api/v1/blood-banks")
    banks = json.loads(r.read())
    print("Blood Banks count:", len(banks))
    if banks:
        print("First bank:", banks[0]["name"], "| City:", banks[0]["city"])

    rc = urllib.request.urlopen("http://127.0.0.1:8000/api/v1/camps")
    camps = json.loads(rc.read())
    print("Camps count:", len(camps))
    if camps:
        print("First camp:", camps[0]["title"], "| City:", camps[0]["city"])

    rm = urllib.request.urlopen("http://127.0.0.1:8000/api/v1/map/facilities")
    facs = json.loads(rm.read())
    print("Map Facilities count:", len(facs))

    rr = urllib.request.urlopen("http://127.0.0.1:8000/api/v1/requests")
    reqs = json.loads(rr.read())
    print("Blood Requests count:", len(reqs))
    if reqs:
        print("First request:", reqs[0]["patient_case_ref"], "| Hospital:", reqs[0].get("hospital_name"), "| Group:", reqs[0]["blood_group"])

if __name__ == "__main__":
    check()
