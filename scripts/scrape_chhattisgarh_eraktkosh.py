import os
import json
import csv
import ssl
import urllib.request
from datetime import datetime, timedelta

# Create SSL context
ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Referer': 'https://eraktkosh.mohfw.gov.in/eraktkoshPortal/',
    'Accept': 'application/json, text/plain, */*'
}

STATE_CODE_CHHATTISGARH = "22"
BASE_PORTAL_API = "https://eraktkosh.mohfw.gov.in/eraktkoshPortal/eraktkosh"
OUTPUT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'data', 'chhattisgarh'))

os.makedirs(OUTPUT_DIR, exist_ok=True)

def fetch_json(url):
    print(f"[*] Fetching: {url}")
    req = urllib.request.Request(url, headers=HEADERS)
    with urllib.request.urlopen(req, context=ctx, timeout=30) as resp:
        content = resp.read().decode('utf-8', errors='ignore')
        return json.loads(content)

def save_json(data, filename):
    filepath = os.path.join(OUTPUT_DIR, filename)
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    print(f"[+] Saved JSON: {filepath} ({len(data)} records)")
    return filepath

def save_csv(data, filename, fieldnames):
    filepath = os.path.join(OUTPUT_DIR, filename)
    with open(filepath, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames, extrasaction='ignore')
        writer.writeheader()
        for row in data:
            writer.writerow(row)
    print(f"[+] Saved CSV: {filepath} ({len(data)} rows)")
    return filepath

def main():
    print("==================================================")
    print("[*] e-RaktKosh Chhattisgarh Data Scraper & Analyzer")
    print("==================================================")
    
    # 1. Scraping Blood Center Directory
    print("\n[1/3] Scraping Blood Center Directory for Chhattisgarh...")
    dir_url = f"{BASE_PORTAL_API}/bloodbanks?stateCode={STATE_CODE_CHHATTISGARH}"
    centers_data = fetch_json(dir_url)
    save_json(centers_data, "blood_centers_directory.json")
    if centers_data:
        save_csv(centers_data, "blood_centers_directory.csv", ["hospitalCode", "hospitalName", "mobileNo"])

    # 2. Scraping Blood Stock Availability
    print("\n[2/3] Scraping Blood Stock Availability for Chhattisgarh...")
    avail_url = f"{BASE_PORTAL_API}/blood-availability?stateCode={STATE_CODE_CHHATTISGARH}"
    avail_data = fetch_json(avail_url)
    save_json(avail_data, "blood_availability.json")
    
    # Flatten availability data for CSV
    flattened_avail = []
    for item in avail_data:
        flattened_avail.append({
            "hospitalCode": item.get("hospitalCode"),
            "hospitalName": item.get("hospitalname"),
            "address": item.get("hospitaladd"),
            "contact": item.get("hospitalcontact"),
            "category": item.get("category"),
            "type": item.get("type"),
            "lastUpdated": item.get("lastUpdatedDate"),
            "totalUnits": item.get("count"),
            "moderateStock": item.get("moderateStock"),
            "criticalStock": item.get("criticalStock"),
            "stockBreakdown": str(item.get("bloodGroupCountList") or item.get("componentList") or "")
        })
    if flattened_avail:
        save_csv(flattened_avail, "blood_availability.csv", [
            "hospitalCode", "hospitalName", "address", "contact", 
            "category", "type", "lastUpdated", "totalUnits", "moderateStock", "criticalStock"
        ])

    # 3. Scraping Blood Donation Camps
    print("\n[3/3] Scraping Blood Donation Camps for Chhattisgarh...")
    today = datetime.now()
    start_date = (today - timedelta(days=90)).strftime("%Y-%m-%d")
    end_date = (today + timedelta(days=120)).strftime("%Y-%m-%d")
    camps_url = f"{BASE_PORTAL_API}/camps/details?stateCode={STATE_CODE_CHHATTISGARH}&districtCode=-1&startDate={start_date}&endDate={end_date}"
    camps_data = fetch_json(camps_url)
    save_json(camps_data, "donation_camps.json")
    if camps_data:
        save_csv(camps_data, "donation_camps.csv", [
            "campReqNo", "campName", "campDate", "campTime", "campVenue",
            "districtName", "conductedBy", "hospName", "contact"
        ])

    # 4. Generate Analysis Summary
    print("\n==================================================")
    print("[*] CHHATTISGARH e-RAKTKOSH DATA ANALYSIS SUMMARY")
    print("==================================================")
    print(f"Total Registered Blood Centers in Directory : {len(centers_data)}")
    print(f"Total Facilities with Stock Reports Listed : {len(avail_data)}")
    print(f"Total Donation Camps Scheduled/Conducted   : {len(camps_data)}")
    
    # District Breakdown for Camps
    district_camp_counts = {}
    for c in camps_data:
        dist = c.get("districtName") or "Unknown"
        district_camp_counts[dist] = district_camp_counts.get(dist, 0) + 1

    print("\nTop Districts by Donation Camps:")
    for dist, count in sorted(district_camp_counts.items(), key=lambda x: x[1], reverse=True)[:10]:
        print(f"  - {dist}: {count} camps")

    # Facility Breakdown
    categories = {}
    for a in avail_data:
        cat = a.get("category") or "Uncategorized"
        categories[cat] = categories.get(cat, 0) + 1

    print("\nFacilities by Category:")
    for cat, count in categories.items():
        print(f"  - {cat}: {count} facilities")

    print("\n[+] Extraction and analysis finished! All files saved in data/chhattisgarh/")

if __name__ == "__main__":
    main()
