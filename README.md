# 🩸 BloodLink — AI-Assisted Emergency Blood Coordination Platform

**BloodLink** is a mission-critical emergency blood coordination web application that connects verified hospitals, registered blood banks, consenting voluntary donors, and patient families into a unified, real-time lifecycle.

Built for clinical governance, zero latency, and privacy compliance across Chhattisgarh state (174 blood centers and 391 donation drives).

---

## ✨ Key Features

- **🚨 Hospital Emergency Command Center:** P0–P3 urgency requisitions with dual-branch parallel matching (Branch A: Blood Banks within 5–25 km radius; Branch B: Consenting voluntary donors).
- **📱 Twilio Automated SMS & Voice Call Dispatch:** When an emergency request is generated, matching registered donors instantly receive priority SMS alerts and automated telephone calls on their registered mobile numbers.
- **📷 Real-Time Camera QR Verification:** Donors accept alerts to generate an instant arrival QR pass, verified at hospital reception via live camera feed to provide bed & department routing.
- **👨‍👩‍👧 Patient Family Status Tracker:** Real-time visibility into donor arrival, collection, and fulfillment status without requiring medical jargon.
- **🤖 BloodBuddy AI Awareness Assistant:** Multilingual educational chatbot (English, हिन्दी, Hinglish) powered by Groq LLM (`openai/gpt-oss-20b`) with medical triage refusal guardrails.
- **🗺️ Interactive Leaflet Live Map:** Live mapping of all 174 state blood centers, donation camps, and regional coordination zones across Chhattisgarh.
- **📝 Dedicated Donor Access & Registration Portal:** Onboarding with blood group, city/locality, alert preferences, and one-click demo profiles.

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Node.js**: v18+ (v20+ LTS recommended)
- **Python**: 3.11+

---

### 2. Start Backend (FastAPI)

```powershell
# In project root:
$env:PYTHONPATH="backend"
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
*Backend API runs at: `http://127.0.0.1:8000` (Interactive Docs: `http://127.0.0.1:8000/docs`).*

To re-seed or reset Chhattisgarh state dataset:
```powershell
python -m app.seed
```

---

### 3. Start Frontend (Next.js 14)

```powershell
cd frontend
npm.cmd install
npm.cmd run dev
```
*Frontend runs at: `http://localhost:3000`.*

---

## 🛠️ Technology Stack

- **Frontend:** Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS, Framer Motion, Lucide Icons, Leaflet / React-Leaflet, HTML5 QR Code Scanner.
- **Backend:** FastAPI, Python 3.11+, SQLAlchemy, SQLite / PostgreSQL, Pydantic, Twilio SDK / API, Groq Cloud API.
- **Dataset:** Official Chhattisgarh State Blood Transfusion Council & e-RaktKosh directory (174 centers, 391 donation camps).

---

## 📄 License
MIT License. Built for emergency healthcare coordination.
