import math
from datetime import datetime
from sqlalchemy.orm import Session
from app.models.entities import (
    BloodRequest, SourceMatch, Organization, DonorProfile, InventoryItem, Notification, User
)
from app.services.twilio_service import send_emergency_sms, trigger_emergency_call
from app.config import settings

COMPATIBILITY_MAP = {
    # Recipient Blood Group -> Compatible Donor Blood Groups
    "O-": ["O-"],
    "O+": ["O-", "O+"],
    "A-": ["O-", "A-"],
    "A+": ["O-", "O+", "A-", "A+"],
    "B-": ["O-", "B-"],
    "B+": ["O-", "O+", "B-", "B+"],
    "AB-": ["O-", "A-", "B-", "AB-"],
    "AB+": ["O-", "O+", "A-", "A+", "B-", "B+", "AB-", "AB+"]
}

def calculate_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    # Haversine formula (km)
    R = 6371.0
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (math.sin(dlat / 2) ** 2 +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) *
         math.sin(dlon / 2) ** 2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return round(R * c, 2)

def run_parallel_matching(db: Session, request: BloodRequest, radius_km: float = 25.0):
    hospital = db.query(Organization).filter(Organization.id == request.hospital_id).first()
    h_lat = hospital.latitude if hospital else 28.6139
    h_lon = hospital.longitude if hospital else 77.2090

    compatible_groups = COMPATIBILITY_MAP.get(request.blood_group, [request.blood_group])

    # BRANCH A: Query All Blood Banks within 5 km radius and regional inventory
    blood_banks = db.query(Organization).filter(
        Organization.type == "blood_bank",
        Organization.verification_status == "verified"
    ).all()

    for bank in blood_banks:
        dist = calculate_distance(h_lat, h_lon, bank.latitude, bank.longitude)
        is_within_5km = dist <= 5.0

        # Check inventory for compatible items
        items = db.query(InventoryItem).filter(
            InventoryItem.blood_bank_id == bank.id,
            InventoryItem.component == request.component,
            InventoryItem.blood_group.in_(compatible_groups),
            InventoryItem.units_available > 0
        ).all()
        has_stock = len(items) > 0

        # Broadcast to all blood banks within 5 km, plus any regional banks with stock
        if is_within_5km or (dist <= radius_km and has_stock):
            total_units = sum(i.units_available for i in items) if items else 0
            primary_status = items[0].status if items else "CONFIRMED_AVAILABLE"
            
            notes = (
                f"🚨 Emergency requisition within 5km radius ({dist} km away). Database stock: {total_units} units."
                if is_within_5km
                else f"Regional blood bank ({dist} km away). Available stock: {total_units} units."
            )

            match = SourceMatch(
                request_id=request.id,
                source_type="blood_bank",
                source_id=bank.id,
                source_name=bank.name,
                contact_phone=bank.contact_phone,
                distance_km=dist,
                freshness_status=primary_status,
                response_state="NOTIFIED",
                units_offered=request.quantity_required if total_units == 0 else min(total_units, request.quantity_required),
                notes=notes
            )
            db.add(match)

            # In-app notification for the blood bank
            notif = Notification(
                user_id=f"bank-{bank.id}",
                request_id=request.id,
                title=f"🚨 Emergency Blood Request (< 5km) — {request.urgency}",
                body=f"Immediate requirement for {request.blood_group} {request.component.upper()} ({request.quantity_required} Units) at {hospital.name if hospital else 'Hospital'} ({dist} km away). Location: {request.destination_dept}.",
                priority=request.urgency,
                channel="IN_APP",
                status="DELIVERED"
            )
            db.add(notif)

    # BRANCH B: Query Consenting Donors

    donors = db.query(DonorProfile).join(User).filter(
        DonorProfile.blood_group.in_(compatible_groups),
        DonorProfile.opt_in_alerts == True,
        DonorProfile.availability_state == "available"
    ).all()

    alerted_phones = set()
    for donor in donors:
        dist = calculate_distance(h_lat, h_lon, donor.latitude, donor.longitude)
        if dist <= radius_km:
            donor_name = donor.user.display_name if donor.user else "Verified Donor"
            match = SourceMatch(
                request_id=request.id,
                source_type="donor",
                source_id=donor.id,
                source_name=f"{donor_name} ({donor.blood_group})",
                contact_phone="REDACTED_UNTIL_ACCEPTED",
                distance_km=dist,
                freshness_status="CONFIRMED",
                response_state="NOTIFIED",
                units_offered=1,
                notes=f"Opted-in donor in {donor.area}"
            )
            db.add(match)

            # In-app notification for the donor
            notif = Notification(
                user_id=donor.user_id,
                request_id=request.id,
                title=f"🚨 Emergency Blood Request ({request.urgency})",
                body=f"Urgent requirement for {request.blood_group} {request.component.upper()} at {hospital.name if hospital else 'Hospital'} ({dist} km away).",
                priority=request.urgency,
                channel="IN_APP",
                status="DELIVERED"
            )
            db.add(notif)

            # Twilio SMS & Voice Call dispatch directly to the registered donor's phone number
            donor_registered_phone = None
            if donor.user and donor.user.phone:
                clean_phone = donor.user.phone.strip().replace(" ", "").replace("-", "")
                if clean_phone:
                    if clean_phone.startswith("+"):
                        donor_registered_phone = clean_phone
                    elif clean_phone.startswith("91") and len(clean_phone) == 12:
                        donor_registered_phone = f"+{clean_phone}"
                    elif len(clean_phone) == 10:
                        donor_registered_phone = f"+91{clean_phone}"
                    else:
                        donor_registered_phone = f"+{clean_phone}"

            target_phone = donor_registered_phone or settings.TWILIO_DEFAULT_TO_PHONE
            if target_phone and target_phone not in alerted_phones:
                alerted_phones.add(target_phone)
                print(f"[+] Emergency Dispatch: Sending Twilio SMS & Call to registered donor '{donor_name}' at {target_phone}...")
                try:
                    send_emergency_sms(to_phone=target_phone)
                except Exception as sms_err:
                    print(f"[-] Twilio SMS dispatch warning for {target_phone}: {sms_err}")
                try:
                    trigger_emergency_call(to_phone=target_phone)
                except Exception as call_err:
                    print(f"[-] Twilio Call dispatch warning for {target_phone}: {call_err}")


    # Fallback Twilio alert to verified emergency phone if no donor phones reached yet
    if not alerted_phones and settings.TWILIO_DEFAULT_TO_PHONE:
        alerted_phones.add(settings.TWILIO_DEFAULT_TO_PHONE)
        try:
            send_emergency_sms(to_phone=settings.TWILIO_DEFAULT_TO_PHONE)
        except Exception as sms_err:
            print(f"[-] Twilio fallback SMS warning: {sms_err}")
        try:
            trigger_emergency_call(to_phone=settings.TWILIO_DEFAULT_TO_PHONE)
        except Exception as call_err:
            print(f"[-] Twilio fallback Call warning: {call_err}")

    db.commit()

