import urllib.request
import urllib.parse
import base64
import json
import logging
from app.config import settings

logger = logging.getLogger(__name__)

def send_emergency_sms(to_phone: str, body_template: str = None) -> dict:
    """
    Sends emergency SMS alert to donor via Twilio API.
    Uses user-configured template 'sms_internal_alerts' for Twilio trial compatibility.
    """
    sid = settings.TWILIO_ACCOUNT_SID
    token = settings.TWILIO_AUTH_TOKEN
    from_phone = settings.TWILIO_FROM_PHONE
    recipient = (to_phone or settings.TWILIO_DEFAULT_TO_PHONE).strip()
    if not recipient.startswith("+"):
        recipient = f"+91{recipient.lstrip('0')}"

    # Default to user's registered template
    body = body_template or settings.TWILIO_SMS_BODY

    url = f"https://api.twilio.com/2010-04-01/Accounts/{sid}/Messages.json"
    auth_header = "Basic " + base64.b64encode(f"{sid}:{token}".encode("utf-8")).decode("utf-8")

    data = urllib.parse.urlencode({
        "To": recipient,
        "From": from_phone,
        "Body": body
    }).encode("utf-8")

    req = urllib.request.Request(url, data=data, headers={
        "Authorization": auth_header,
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": "BloodLink/1.0"
    })

    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            resp_body = json.loads(resp.read().decode("utf-8"))
            print(f"[+] Twilio SMS dispatched successfully to {recipient} (SID: {resp_body.get('sid')})")
            return {"success": True, "sid": resp_body.get("sid"), "status": resp_body.get("status")}
    except Exception as e:
        err_msg = str(e)
        if hasattr(e, "read"):
            try:
                err_msg += " - " + e.read().decode("utf-8")
            except Exception:
                pass
        print(f"[-] Twilio SMS dispatch warning for {recipient}: {err_msg}")
        return {"success": False, "error": err_msg}

def trigger_emergency_call(to_phone: str) -> dict:
    """
    Triggers emergency Voice Call to donor via Twilio Voice API.
    """
    sid = settings.TWILIO_ACCOUNT_SID
    token = settings.TWILIO_AUTH_TOKEN
    from_phone = settings.TWILIO_FROM_PHONE
    recipient = (to_phone or settings.TWILIO_DEFAULT_TO_PHONE).strip()
    if not recipient.startswith("+"):
        recipient = f"+91{recipient.lstrip('0')}"

    call_url = f"https://api.twilio.com/2010-04-01/Accounts/{sid}/Calls.json"
    auth_header = "Basic " + base64.b64encode(f"{sid}:{token}".encode("utf-8")).decode("utf-8")

    data = urllib.parse.urlencode({
        "To": recipient,
        "From": from_phone,
        "Url": settings.TWILIO_CALL_URL
    }).encode("utf-8")

    req = urllib.request.Request(call_url, data=data, headers={
        "Authorization": auth_header,
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": "BloodLink/1.0"
    })

    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            resp_body = json.loads(resp.read().decode("utf-8"))
            print(f"[+] Twilio Call placed successfully to {recipient} (SID: {resp_body.get('sid')})")
            return {"success": True, "sid": resp_body.get("sid"), "status": resp_body.get("status")}
    except Exception as e:
        err_msg = str(e)
        if hasattr(e, "read"):
            try:
                err_msg += " - " + e.read().decode("utf-8")
            except Exception:
                pass
        print(f"[-] Twilio Call dispatch warning for {recipient}: {err_msg}")
        return {"success": False, "error": err_msg}
