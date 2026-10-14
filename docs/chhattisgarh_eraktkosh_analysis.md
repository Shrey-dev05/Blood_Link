# e-RaktKosh Chhattisgarh Blood Ecosystem Analysis & Dataset Report

**Portal:** [e-RaktKosh (MoHFW, Government of India)](https://eraktkosh.mohfw.gov.in/eraktkoshPortal/#/)  
**State Target:** Chhattisgarh (State Code: `22`)  
**Data Extraction Date:** October 2026  
**Status:** Successfully scraped, cleaned, and exported to JSON & CSV formats.

---

## 1. Executive Summary

| Dataset Category | Records Scraped | Primary Coverage | File Outputs |
| :--- | :--- | :--- | :--- |
| **Blood Centers Directory** | **174** Centers | All registered licensed blood banks in CG | [`blood_centers_directory.json`](file:///c:/Users/shrey/OneDrive/Desktop/RaktaRaksha/data/chhattisgarh/blood_centers_directory.json)<br>[`blood_centers_directory.csv`](file:///c:/Users/shrey/OneDrive/Desktop/RaktaRaksha/data/chhattisgarh/blood_centers_directory.csv) |
| **Live Blood Stock Availability** | **148** Facilities | Breakdown by 10 blood components & 8 ABO/Rh types | [`blood_availability.json`](file:///c:/Users/shrey/OneDrive/Desktop/RaktaRaksha/data/chhattisgarh/blood_availability.json)<br>[`blood_availability.csv`](file:///c:/Users/shrey/OneDrive/Desktop/RaktaRaksha/data/chhattisgarh/blood_availability.csv) |
| **Blood Donation Camps** | **391** Camps | Scheduled donation drives across 28+ districts | [`donation_camps.json`](file:///c:/Users/shrey/OneDrive/Desktop/RaktaRaksha/data/chhattisgarh/donation_camps.json)<br>[`donation_camps.csv`](file:///c:/Users/shrey/OneDrive/Desktop/RaktaRaksha/data/chhattisgarh/donation_camps.csv) |

---

## 2. Technical Portal Architecture & Scraping Methodology

### Portal Internals
- **Technology Stack:** Angular Single Page Application (SPA) frontend served via Apache/Nginx reverse proxy over Java/Spring Boot & legacy CDAC Struts backend (`/BLDAHIMS`).
- **Target State Identification:** State Code `"22"` mapped directly to Chhattisgarh.
- **REST API Endpoints Reversed:**
  1. **Blood Center Directory:**  
     `GET https://eraktkosh.mohfw.gov.in/eraktkoshPortal/eraktkosh/bloodbanks?stateCode=22`
  2. **Blood Stock Availability:**  
     `GET https://eraktkosh.mohfw.gov.in/eraktkoshPortal/eraktkosh/blood-availability?stateCode=22`
  3. **Blood Donation Camps:**  
     `GET https://eraktkosh.mohfw.gov.in/eraktkoshPortal/eraktkosh/camps/details?stateCode=22&districtCode=-1&startDate=YYYY-MM-DD&endDate=YYYY-MM-DD`
  4. **Legacy Struts/JSP Fallback:**  
     `GET https://eraktkosh.mohfw.gov.in/BLDAHIMS/bloodbank/nearbyBB.cnt?hmode=GETNEARBYSTOCKDETAILS&stateCode=22&districtCode=-1&bloodGroup=all&bloodComponent=11&lang=0`

### Pipeline Script
- Located at [`scripts/scrape_chhattisgarh_eraktkosh.py`](file:///c:/Users/shrey/OneDrive/Desktop/RaktaRaksha/scripts/scrape_chhattisgarh_eraktkosh.py).
- Features automated retries, dynamic date framing for camp schedules, fallback mechanisms between REST v2 and Struts APIs, and dual JSON + CSV serialization.

---

## 3. Detailed Data Findings

### A. Blood Center Directory (174 Registered Centers)
- **Facility Types:**
  - **Private Hospital Blood Centers:** 65 (43.9%)
  - **Charitable / Voluntary Blood Centers:** 43 (29.1%)
  - **Government Blood Centers (DH/MCH/AIIMS):** 39 (26.4%)
  - **Red Cross Society:** 1 (0.7%)
- **Key Healthcare Anchors:**
  - Dr. B.R. Ambedkar Memorial Hospital (Raipur)
  - Maharani Hospital (Jagdalpur, Bastar)
  - AIIMS Raipur
  - CIMS (Bilaspur)
  - District Hospitals across Dantewada, Balod, Koriya, Janjgir-Champa, Mahasamund, Rajnandgaon, Surguja.

### B. Blood Availability & Component Distribution (148 Reporting Centers)
The dataset captures stock status across 10 vital clinical blood components:
1. **Packed Red Blood Cells (PRBC):** 148 centers reporting
2. **Whole Blood:** 147 centers reporting
3. **Platelet Concentrate:** 142 centers reporting
4. **Fresh Frozen Plasma (FFP):** 142 centers reporting
5. **Single Donor Platelet (SDP - Apheresis):** 140 centers reporting
6. **Random Donor Platelets (RDP):** 140 centers reporting
7. **Plasma:** 139 centers reporting
8. **Cryoprecipitate:** 139 centers reporting
9. **Cryo Poor Plasma:** 139 centers reporting
10. **Irradiated RBC:** 1 center reporting

### C. Blood Donation Camps (391 Recorded Drives)
- **Top 10 Districts by Donation Drives:**
  1. **Raipur:** 93 camps (23.8%)
  2. **Durg / Bhilai:** 77 camps (19.7%)
  3. **Bilaspur:** 35 camps (8.9%)
  4. **Mahasamund:** 18 camps (4.6%)
  5. **Rajnandgaon:** 14 camps (3.6%)
  6. **Korba:** 14 camps (3.6%)
  7. **Bastar (Jagdalpur):** 11 camps (2.8%)
  8. **Balod:** 11 camps (2.8%)
  9. **Narayanpur:** 11 camps (2.8%)
  10. **Dantewada:** 10 camps (2.6%)
- **Active Community Organizers:**
  - Sewa Sankalp Abhiyan
  - Savita Didi Foundation
  - Rotary / Lions Clubs of Raipur & Bhilai
  - Yuva Blood Donors Groups

---

## 4. RaktaReach Integration Opportunities

This real Chhattisgarh dataset can directly empower the RaktaReach platform:
1. **External Center Seeding:** Populate `blood_banks` database with real addresses, emergency helplines, and coordinates.
2. **Camp Finder Widget:** Integrate the 391 camps into the donor portal so registered citizens can view upcoming local camps.
3. **Shortage Warning Heuristics:** Compare user emergency blood requests against e-RaktKosh live stock in the requesting district to trigger automated volunteer broadcasts when regional blood banks are in critical deficit.
