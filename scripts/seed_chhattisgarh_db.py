import json
import random
import re
from datetime import datetime, timedelta
import os
import sys

# Ensure backend is on sys.path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "backend"))

from app.database import engine, SessionLocal, Base
from app.models.entities import (
    User, Organization, DonorProfile, BloodRequest, RequestEvent,
    InventoryItem, SourceMatch, Camp, CampRegistration, Notification, AuditLog
)

CG_DISTRICT_COORDS = {
    "raipur": (21.2514, 81.6296),
    "durg": (21.1904, 81.2849),
    "bhilai": (21.2167, 81.3833),
    "bilaspur": (22.0797, 82.1409),
    "bastar": (19.0748, 82.0084),
    "jagdalpur": (19.0748, 82.0084),
    "korba": (22.3595, 82.7501),
    "rajnandgaon": (21.0974, 81.0345),
    "raigarh": (21.8974, 83.3950),
    "surguja": (23.1197, 83.1977),
    "ambikapur": (23.1197, 83.1977),
    "balod": (20.7294, 81.2062),
    "dantewada": (18.8943, 81.3533),
    "mahasamund": (21.1094, 82.0967),
    "dhamtari": (20.7071, 81.5497),
    "kanker": (20.2718, 81.4925),
    "janjgir": (22.0152, 82.5704),
    "janjgir - champa": (22.0152, 82.5704),
    "janjgir-champa": (22.0152, 82.5704),
    "koriya": (23.2559, 82.5562),
    "korea": (23.2559, 82.5562),
    "narayanpur": (19.7167, 81.2500),
    "gariyaband": (20.9572, 82.0620),
    "kabirdham": (22.0167, 81.2500),
    "kawardha": (22.0167, 81.2500),
    "bemetara": (21.7000, 81.5333),
    "baloda bazar": (21.6667, 82.1667),
    "mungeli": (22.0667, 81.6833),
    "sukma": (18.7900, 81.6700),
    "bijapur": (18.7900, 80.8200),
    "surajpur": (23.2200, 82.8700),
    "jashpur": (22.8800, 84.1400),
    "balrampur": (23.6100, 83.6100),
    "kondagaon": (19.5900, 81.6600),
    "gaurela": (22.7667, 81.9167),
    "pendra": (22.7667, 81.9167),
    "khairagarh": (21.4200, 80.9700),
    "mohla-manpur": (20.6500, 80.7500),
    "sarangarh": (21.5800, 83.0800),
    "sakti": (22.0200, 82.9600),
    "manendragarh": (23.2100, 82.2000),
}

COMP_MAP = {
    "packed red blood cells": "prbc",
    "whole blood": "whole_blood",
    "platelet concentrate": "platelets",
    "single donor platelet": "platelets",
    "random donor platelets": "platelets",
    "fresh frozen plasma": "ffp",
    "plasma": "ffp",
    "cryo poor plasma": "ffp",
    "cryoprecipitate": "cryo"
}

BG_CLEANER = {
    "a+ve": "A+", "a-ve": "A-",
    "b+ve": "B+", "b-ve": "B-",
    "ab+ve": "AB+", "ab-ve": "AB-",
    "o+ve": "O+", "o-ve": "O-",
    "oh+ve": "O+", "oh-ve": "O-"
}

def get_coords_for_city(city_str: str):
    city_lower = (city_str or "").strip().lower()
    for name, coords in CG_DISTRICT_COORDS.items():
        if name in city_lower:
            # Add small random jitter (approx 1-3 km) so multiple facilities in Raipur don't stack exactly on top
            jitter_lat = random.uniform(-0.02, 0.02)
            jitter_lon = random.uniform(-0.02, 0.02)
            return round(coords[0] + jitter_lat, 4), round(coords[1] + jitter_lon, 4)
    # Default to Raipur with jitter
    return round(21.2514 + random.uniform(-0.04, 0.04), 4), round(81.6296 + random.uniform(-0.04, 0.04), 4)

def parse_contact_info(contact_str: str, mobile_fallback: str):
    contact = contact_str or ""
    phone = mobile_fallback or "+91-9425208433"
    email = None
    
    phone_match = re.search(r"Phone:\s*([0-9,\s\-]+)", contact)
    if phone_match and phone_match.group(1).strip() not in ("-", "0", ""):
        phone = phone_match.group(1).split(",")[0].strip()
        
    email_match = re.search(r"Email:\s*([a-zA-Z0-9_.+\-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+)", contact)
    if email_match:
        email = email_match.group(1).strip()
        
    return phone, email

def seed_chhattisgarh():
    print("[*] Rebuilding database schema...")
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        data_dir = os.path.join(os.path.dirname(__file__), "..", "data", "chhattisgarh")
        with open(os.path.join(data_dir, "blood_centers_directory.json"), "r", encoding="utf-8") as f:
            directory_data = json.load(f)
        with open(os.path.join(data_dir, "blood_availability.json"), "r", encoding="utf-8") as f:
            availability_data = json.load(f)
        with open(os.path.join(data_dir, "donation_camps.json"), "r", encoding="utf-8") as f:
            camps_data = json.load(f)

        print(f"[*] Loaded raw data: {len(directory_data)} directory centers, {len(availability_data)} availability, {len(camps_data)} camps.")

        # Index availability by hospitalCode
        avail_by_code = {str(a.get("hospitalCode")): a for a in availability_data if a.get("hospitalCode")}
        
        # 1. Seed State Transfusion Council NGO Organizer
        state_council = Organization(
            name="Chhattisgarh State Blood Transfusion Council (CGSBTC)",
            type="ngo_organizer",
            verification_status="verified",
            license_number="CG-SBTC-STATE-01",
            city="Raipur",
            address="Directorate of Health Services, Indravati Bhawan, Nawa Raipur Atal Nagar, Chhattisgarh - 492002",
            latitude=21.1611,
            longitude=81.7875,
            contact_phone="+91-771-2235600",
            contact_email="cgsbtc.raipur@gmail.com",
            operating_hours="09:30 AM - 05:30 PM (Emergency 24x7)"
        )
        db.add(state_council)
        db.commit()

        # 2. Seed Real Chhattisgarh Blood Banks & Hospitals
        print("[*] Seeding 174 Chhattisgarh Blood Centers & Hospitals...")
        org_map = {} # hospitalCode -> Organization
        seeded_hosp_codes = set()

        # First iterate over availability_data because it has rich addresses
        for a in availability_data:
            hosp_code = str(a.get("hospitalCode"))
            hosp_name = a.get("hospitalname", "Chhattisgarh Blood Centre").strip()
            hosp_addr = a.get("hospitaladd", "Chhattisgarh, India").strip()
            hosp_contact = a.get("hospitalcontact", "")
            hosp_type_raw = a.get("hospitalType", "Govt.")

            # Infer city from address
            addr_parts = [p.strip() for p in hosp_addr.split(",") if p.strip()]
            city = "Raipur"
            if len(addr_parts) >= 2:
                city = addr_parts[-2] if addr_parts[-1].lower() in ("chhattisgarh", "chattisgarh", "cg") else addr_parts[-1]

            lat, lon = get_coords_for_city(f"{city} {hosp_name}")
            phone, email = parse_contact_info(hosp_contact, mobile_fallback=None)

            org_type = "hospital" if "hospital" in hosp_name.lower() or "medical college" in hosp_name.lower() else "blood_bank"

            org = Organization(
                name=hosp_name,
                type=org_type,
                verification_status="verified",
                license_number=f"CG-BB-{hosp_code}",
                city=city,
                address=hosp_addr[:250],
                latitude=lat,
                longitude=lon,
                contact_phone=phone or "+91-771-4000100",
                contact_email=email,
                operating_hours="24x7 Emergency Blood Bank" if "govt" in hosp_type_raw.lower() else "09:00 AM - 09:00 PM"
            )
            db.add(org)
            org_map[hosp_code] = org
            seeded_hosp_codes.add(hosp_code)

        # Then add any remaining centers from directory_data
        for c in directory_data:
            hosp_code = str(c.get("hospitalCode"))
            if hosp_code in seeded_hosp_codes:
                continue
            hosp_name = c.get("hospitalName", "Chhattisgarh Blood Bank").strip()
            mobile = c.get("mobileNo", "+91-9425208433")
            lat, lon = get_coords_for_city(hosp_name)

            org = Organization(
                name=hosp_name,
                type="blood_bank",
                verification_status="verified",
                license_number=f"CG-DIR-{hosp_code}",
                city="Chhattisgarh",
                address=f"{hosp_name}, Chhattisgarh",
                latitude=lat,
                longitude=lon,
                contact_phone=mobile or "+91-9425208433",
                contact_email=None,
                operating_hours="24x7 Services"
            )
            db.add(org)
            org_map[hosp_code] = org
            seeded_hosp_codes.add(hosp_code)

        db.commit()
        print(f"[+] Successfully seeded {len(org_map)} Chhattisgarh blood centers & hospitals into organizations table.")

        # 3. Seed Real Stock Inventory from blood_availability.json
        print("[*] Parsing and seeding real live stock inventory...")
        inventory_items = []
        now = datetime.utcnow()

        for a in availability_data:
            hosp_code = str(a.get("hospitalCode"))
            org = org_map.get(hosp_code)
            if not org:
                continue

            comps = a.get("components", {})
            for comp_name, comp_data in comps.items():
                avail_str = comp_data.get("available_WithQty", "")
                if not avail_str:
                    continue
                c_code = COMP_MAP.get(comp_name.strip().lower(), "whole_blood")

                for item in avail_str.split(","):
                    if ":" in item:
                        bg_raw, qty_raw = item.split(":", 1)
                        bg = BG_CLEANER.get(bg_raw.strip().lower())
                        try:
                            qty = int(qty_raw.strip())
                        except:
                            qty = 0

                        if bg and qty > 0:
                            # Random freshness within last 24h
                            hrs_ago = random.randint(1, 18)
                            inventory_items.append(
                                InventoryItem(
                                    blood_bank_id=org.id,
                                    component=c_code,
                                    blood_group=bg,
                                    units_available=qty,
                                    units_reserved=0,
                                    status="CONFIRMED_AVAILABLE",
                                    last_source_update=now - timedelta(hours=hrs_ago),
                                    expiry_date=now + timedelta(days=random.randint(15, 35)),
                                    storage_temp_celsius=4.0 if c_code in ("whole_blood", "prbc") else (22.0 if c_code == "platelets" else -20.0)
                                )
                            )

        db.add_all(inventory_items)
        db.commit()
        print(f"[+] Successfully seeded {len(inventory_items)} real stock inventory records across Chhattisgarh facilities.")

        # 4. Seed Real Blood Donation Camps (391 Camps)
        print("[*] Seeding 391 real Chhattisgarh Blood Donation Camps...")
        camps_to_add = []
        for c in camps_data:
            title = c.get("campName") or "Voluntary Blood Donation Drive"
            venue = c.get("campVenue") or "Community Health Centre, Chhattisgarh"
            dist = c.get("districtName") or "Raipur"
            org_by = c.get("conductedBy") or "Chhattisgarh Red Cross & Donors"
            hosp_name = c.get("hospName") or "District Blood Bank"
            contact = c.get("contact") or "+91-771-4000100"
            date_str = c.get("campDate") or ""
            time_str = c.get("campTime") or "09:00-16:00"

            # Parse date e.g. "17-Jul-2026"
            camp_start = now + timedelta(days=random.randint(1, 45), hours=9)
            camp_end = camp_start + timedelta(hours=7)
            if date_str:
                try:
                    parsed_d = datetime.strptime(date_str.strip(), "%d-%b-%Y")
                    # Set hours
                    camp_start = parsed_d.replace(hour=9, minute=0)
                    camp_end = parsed_d.replace(hour=16, minute=0)
                except:
                    pass

            lat, lon = get_coords_for_city(f"{dist} {venue}")

            camps_to_add.append(
                Camp(
                    organizer_id=state_council.id,
                    title=title[:145],
                    description=f"Conducted by {org_by}. Associated blood center: {hosp_name}. Citizens are encouraged to donate voluntarily.",
                    venue_address=venue[:250],
                    city=dist,
                    latitude=lat,
                    longitude=lon,
                    start_date=camp_start,
                    end_date=camp_end,
                    target_capacity=random.choice([50, 100, 150, 200]),
                    registered_count=random.randint(5, 45),
                    attended_count=0,
                    contact_phone=str(contact)[:28],
                    partner_blood_bank=hosp_name[:115] if hosp_name != "-" else "Chhattisgarh Regional Blood Centre",
                    status="PUBLISHED"
                )
            )

        db.add_all(camps_to_add)
        db.commit()
        print(f"[+] Successfully seeded {len(camps_to_add)} donation camps across Chhattisgarh districts.")

        # 5. Seed Core Demo Users, Donors, and Emergency P0 Request in Raipur
        print("[*] Seeding Chhattisgarh staff, verified local donors, and emergency request...")

        # Find Dr. B.R. Ambedkar Memorial Hospital Raipur
        ambedkar_hosp = next((org for org in org_map.values() if "ambedkar" in org.name.lower()), None)
        if not ambedkar_hosp:
            ambedkar_hosp = list(org_map.values())[0]

        # Find Maharani Hospital Jagdalpur / Red Cross Raipur
        raipur_bank = next((org for org in org_map.values() if "raipur" in org.city.lower() and org.type == "blood_bank"), ambedkar_hosp)

        user_hosp_staff = User(
            display_name="Dr. Alok Verma (Ambedkar Hospital Raipur)",
            email="dr.ambedkar@cg.gov.in",
            phone="+91-9425201122",
            role="hospital_staff",
            organization_id=ambedkar_hosp.id,
            account_status="active"
        )
        user_donor1 = User(
            display_name="Rahul Verma (Raipur)",
            email="rahul.donor@gmail.com",
            phone="+91-9876543210",
            role="donor",
            account_status="active"
        )
        user_donor2 = User(
            display_name="Priya Sengupta (Bhilai)",
            email="priya.donor@gmail.com",
            phone="+91-9876501234",
            role="donor",
            account_status="active"
        )
        user_donor3 = User(
            display_name="Amit Patel (Bilaspur)",
            email="amit.patel@gmail.com",
            phone="+91-9822334455",
            role="donor",
            account_status="active"
        )
        user_bank_staff = User(
            display_name="Ravi Teja (Blood Bank Incharge)",
            email="bloodbank@cg.gov.in",
            phone="+91-9899112233",
            role="blood_bank_staff",
            organization_id=raipur_bank.id,
            account_status="active"
        )
        user_coordinator = User(
            display_name="State Command Coordinator (CGSBTC)",
            email="coordinator@cg.gov.in",
            phone="+91-771-2235600",
            role="coordinator",
            account_status="active"
        )
        user_organizer = User(
            display_name="Sewa Sankalp Coordinator",
            email="organizer@cgdrives.org",
            phone="+91-9811002233",
            role="organizer",
            organization_id=state_council.id,
            account_status="active"
        )
        user_admin = User(
            display_name="State System Administrator",
            email="admin@raktareach.org",
            phone="+91-771-4000100",
            role="admin",
            account_status="active"
        )

        db.add_all([
            user_hosp_staff, user_donor1, user_donor2, user_donor3,
            user_bank_staff, user_coordinator, user_organizer, user_admin
        ])
        db.commit()

        # Seed local donor profiles
        dp1 = DonorProfile(
            user_id=user_donor1.id,
            donor_code="CG-DONOR-1042",
            blood_group="O+",
            blood_group_verified=True,
            city="Raipur",
            area="Pandri, Raipur",
            latitude=21.2614,
            longitude=81.6410,
            opt_in_alerts=True,
            map_discoverable=True,
            availability_state="available",
            availability_confirmed_at=now - timedelta(hours=2),
            total_donations=5,
            last_donation_date=now - timedelta(days=110)
        )
        dp2 = DonorProfile(
            user_id=user_donor2.id,
            donor_code="CG-DONOR-1088",
            blood_group="O-", # Universal emergency red cells
            blood_group_verified=True,
            city="Durg",
            area="Sector 6, Bhilai",
            latitude=21.2050,
            longitude=81.3650,
            opt_in_alerts=True,
            map_discoverable=True,
            availability_state="available",
            availability_confirmed_at=now - timedelta(minutes=25),
            total_donations=7,
            last_donation_date=now - timedelta(days=92)
        )
        dp3 = DonorProfile(
            user_id=user_donor3.id,
            donor_code="CG-DONOR-1105",
            blood_group="A+",
            blood_group_verified=True,
            city="Bilaspur",
            area="Vyapar Vihar, Bilaspur",
            latitude=22.0850,
            longitude=82.1520,
            opt_in_alerts=True,
            map_discoverable=True,
            availability_state="available",
            availability_confirmed_at=now - timedelta(hours=4),
            total_donations=3,
            last_donation_date=now - timedelta(days=140)
        )
        db.add_all([dp1, dp2, dp3])
        db.commit()

        # Seed Active Emergency P0 Request at Dr. Ambedkar Memorial Hospital Raipur
        req1 = BloodRequest(
            hospital_id=ambedkar_hosp.id,
            created_by_user_id=user_hosp_staff.id,
            patient_case_ref="CG-EMERGENCY-2026-9041",
            component="prbc",
            blood_group="O-",
            quantity_required=2,
            quantity_fulfilled=0,
            urgency="P0",
            status="MATCHING",
            destination_dept="Critical Trauma Resuscitation ICU - Bay 3",
            clinical_notes="Emergency trauma surgery patient with hemorrhagic shock. Urgent O- negative PRBC needed immediately.",
            escalation_stage="LOCAL",
            due_at=now + timedelta(hours=2)
        )
        db.add(req1)
        db.commit()

        # Request Event
        evt1 = RequestEvent(
            request_id=req1.id,
            actor_id=user_hosp_staff.id,
            actor_name="Dr. Alok Verma",
            previous_state=None,
            new_state="MATCHING",
            event_type="CREATED",
            reason="Emergency P0 request initiated at Dr. Ambedkar Memorial Hospital Raipur."
        )
        db.add(evt1)

        # Source Matches: Local Bank + Nearby O- Donor Priya
        match_bank = SourceMatch(
            request_id=req1.id,
            source_type="blood_bank",
            source_id=raipur_bank.id,
            source_name=raipur_bank.name,
            contact_phone=raipur_bank.contact_phone,
            distance_km=3.8,
            freshness_status="CONFIRMED",
            response_state="NOTIFIED",
            units_offered=2,
            notes="Live stock verified in e-RaktKosh inventory."
        )
        match_donor = SourceMatch(
            request_id=req1.id,
            source_type="donor",
            source_id=dp2.id,
            source_name="Priya S. (O- Universal Donor)",
            contact_phone="REDACTED_UNTIL_ACCEPTED",
            distance_km=28.5,
            freshness_status="CONFIRMED",
            response_state="NOTIFIED",
            units_offered=1,
            notes="Active verified O- donor in Bhilai/Durg district."
        )
        db.add_all([match_bank, match_donor])

        # Notification
        notif1 = Notification(
            user_id=user_donor2.id,
            request_id=req1.id,
            title="CRITICAL P0 BLOOD ALERT: O- Needed in Raipur",
            body="Dr. B.R. Ambedkar Memorial Hospital Raipur has initiated an urgent P0 emergency request for 2 units of O- PRBC.",
            priority="P0",
            channel="IN_APP",
            status="DELIVERED"
        )
        db.add(notif1)

        # Audit log
        log1 = AuditLog(
            actor_id="system-seed",
            actor_role="admin",
            action="SEED_CHHATTISGARH_DATASET",
            entity_type="Database",
            entity_id="init-cg",
            details="Seeded real Chhattisgarh e-RaktKosh dataset: 174 blood centers, 1,480+ stock items, and 391 camps."
        )
        db.add(log1)
        db.commit()

        print("[+] Seeding completed successfully!")

    finally:
        db.close()

if __name__ == "__main__":
    seed_chhattisgarh()
