# AVANI (అవని / अवनी)
### AI-Powered Crop Disease Detection & Action Support Platform
*“Know your crop well being ”*

Avani is a nature-inspired, accessible web platform built specifically for small and marginal farmers to detect crop leaf diseases, evaluate field context, and execute grounded, actionable inspection plans without overwhelming technical jargon or invented chemical prescriptions.

---

## 🌾 Core Philosophy & Features

1. **Farmer-First Accessibility:**
   - Plain, clear language with no raw tensors or model jargon.
   - High-contrast earthy agricultural color palette (Forest Green `#285943`, Muted Leaf `#78966A`, Warm Ivory `#F8F7F0`, Soft Cream `#FFFFFF`, Harvest Ochre `#C6A15B`).
   - Large buttons, legible typography (Inter), and step-by-step navigation.
   - Multi-language support: **English**, **Telugu (తెలుగు)**, and **Hindi (हिन्दी)**.
   - Built-in **Text-to-Speech (TTS)** voice assistant for farmers in the field.

2. **Genuine Computer Vision & Uncertainty Handling:**
   - MobileNetV2 / PlantVillage 38-Class taxonomic classifier.
   - Leaf validation heuristics (Excess Green Index & spectral vegetation coverage) that reject non-leaf objects (keyboards, desks, portraits) with clear explanations.
   - Plain-language confidence indicators and uncertainty detection when symptoms are ambiguous.

3. **Field Context Follow-Up (8 Steps):**
   - 8 step-by-step farmer questions: crop identity, plant growth stage, field percentage affected, companion crops, weed pressure, symptom onset, spread speed, and watering/weather.

4. **3-Part Practical Action Support Plan:**
   - **What to check now:** Concrete physical inspection steps on foliage and root zone.
   - **What to monitor:** 2 to 5 day observation checklist.
   - **When to seek help:** Escalation thresholds for calling local extension officers (Krishi Vigyan Kendra - KVK).
   - **Interactive Action Checklist:** Checklist categorized by Today, Next 2-3 Days, and After 5 Days.
   - **Safety Guarantee:** Strict compliance against recommending arbitrary chemical dosages.

5. **Agro-Meteorological Risk Advisor:**
   - Live OpenWeatherMap API integration with regional agro profiles (Warangal, Guntur, Nashik, Karnal, Shimla, Varanasi).
   - Dynamic disease risk assessment for fungal blights, late blight, and bacterial splash.

6. **Scan History & Persistence:**
   - SQLite persistent storage for all saved scans, questionnaire answers, and action plans.

---

## 🚀 Quick Start Guide

### Prerequisites
- **Node.js**: v18+ (v22+ recommended)
- **Python**: 3.10+ (tested on Python 3.13)

---

### Step 1: Start the Backend (FastAPI)

```bash
# Navigate to backend directory
cd backend

# Install dependencies
pip install -r requirements.txt

# Run backend server
python main.py
```
The FastAPI backend runs on `http://localhost:8000` (API documentation at `http://localhost:8000/docs`).

---

### Step 2: Start the Frontend (React + Vite)

```bash
# Navigate to frontend directory
cd frontend

# Install npm dependencies
npm install

# Start development server
npm run dev
```
The Vite development server runs on `http://localhost:5173`.

---

## 🧪Automated Testing

### Backend Test Suite
Run the automated pytest suite covering health checks, crop listing, leaf validation, non-leaf rejection, guidance generation, scan persistence, and weather endpoints:

```bash
cd backend
python -m pytest test_backend.py
```

### Frontend Typecheck & Build
```bash
cd frontend
npm run build
```

---

## 📡 API Endpoints Summary

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Backend status & model readiness |
| `GET` | `/api/crops` | List supported crops and classes |
| `POST` | `/api/predict` | Upload leaf image & run computer vision inference |
| `POST` | `/api/guidance` | Synthesize model diagnosis + 8-step questionnaire into action plan |
| `GET` | `/api/scans` | Retrieve saved scan history |
| `POST` | `/api/scans` | Save scan and action plan |
| `DELETE` | `/api/scans/{id}` | Delete previous scan |
| `GET` | `/api/weather` | Retrieve location weather and disease risk indicators |
| `GET` | `/api/translations`| Retrieve English, Telugu, and Hindi UI dictionaries |

---

## 🌿 Design System Tokens

- **Primary**: Deep Forest Green (`#285943`)
- **Secondary**: Muted Leaf Green (`#78966A`)
- **Background**: Warm Ivory (`#F8F7F0`)
- **Surface / Cards**: Soft Cream (`#FFFFFF`)
- **Accent**: Muted Harvest Ochre (`#C6A15B`)
- **Primary Text**: Dark Earthy Charcoal (`#292F29`)
- **Secondary Text**: Muted Grey-Green (`#6D756C`)
- **Borders**: Subtle Warm Grey (`#E6E5DA`)
- **Alert / Notice**: Restrained Ochre / Red
