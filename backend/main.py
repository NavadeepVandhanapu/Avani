"""
Avani Backend FastAPI Application
AI-Powered Crop Disease Detection & Action Support Platform
"""

import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, File, UploadFile, Form, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, Any, List, Optional
import json

from model_service import classifier, CLASS_METADATA, PLANT_VILLAGE_CLASSES
from guidance_service import generate_action_plan
from guidance_data import GUIDANCE_DATABASE
from database import init_db, save_scan, get_all_scans, delete_scan, save_feedback
from weather_service import get_weather_data
from translations import TRANSLATIONS

@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    print("[Avani API] Lifespan started: Database initialized & ready.")
    yield

app = FastAPI(
    title="Avani API",
    description="Know your crop well being — AI-Powered Crop Disease Detection & Action Support Platform",
    version="1.0.0",
    lifespan=lifespan
)

# Enable CORS for frontend development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic Schemas
class GuidanceRequest(BaseModel):
    predicted_class: str
    confidence: float
    is_healthy: bool = False
    follow_up_answers: Dict[str, Any] = {}

class SaveScanRequest(BaseModel):
    crop_name: str
    predicted_class: str
    disease_name: str
    is_healthy: bool
    confidence: float
    confidence_level: str
    image_preview: Optional[str] = None
    follow_up_answers: Optional[Dict[str, Any]] = None
    guidance_summary: Optional[Dict[str, Any]] = None

class FeedbackRequest(BaseModel):
    scan_id: Optional[str] = None
    predicted_class: str
    rating: str = "accurate"  # "accurate", "partial", "incorrect"
    is_accurate: bool = True
    actual_condition: Optional[str] = None
    notes: Optional[str] = None

@app.get("/api/health")
def health_check():
    """Health status and model readiness."""
    return {
        "status": "healthy",
        "service": "Avani Crop Disease Inference API",
        "model_loaded": classifier.model_loaded,
        "supported_classes_count": len(classifier.classes)
    }

@app.get("/api/crops")
def get_supported_crops():
    """Returns the list of supported crops and identifiable conditions."""
    crops_summary = {}
    for cls_name in PLANT_VILLAGE_CLASSES:
        meta = CLASS_METADATA.get(cls_name)
        if meta:
            crop = meta["crop"]
            cond = meta["condition"]
            if crop not in crops_summary:
                crops_summary[crop] = []
            crops_summary[crop].append(cond)
            
    return {
        "total_classes": len(PLANT_VILLAGE_CLASSES),
        "supported_crops": crops_summary
    }

@app.post("/api/predict")
async def predict_image(file: UploadFile = File(...)):
    """
    Receives leaf photograph, validates image format and leaf characteristics,
    and runs genuine computer vision inference.
    """
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Uploaded file must be a valid image (JPEG, PNG, WebP).")
    
    contents = await file.read()
    if len(contents) > 15 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Image size exceeds 15MB limit. Please upload a smaller photo.")
    
    if len(contents) < 500:
        raise HTTPException(status_code=400, detail="Image file is empty or corrupted.")

    result = classifier.predict(contents)
    
    pred_cls = result.get("predicted_class", "")
    if pred_cls in GUIDANCE_DATABASE:
        result["visible_symptoms_reference"] = GUIDANCE_DATABASE[pred_cls].get("visible_symptoms", [])
        result["scientific_name"] = GUIDANCE_DATABASE[pred_cls].get("scientific_name", "")
    else:
        result["visible_symptoms_reference"] = [
            "Observe leaf color consistency, texture, and presence of discoloration."
        ]
        result["scientific_name"] = ""

    return result

@app.post("/api/guidance")
def create_guidance(req: GuidanceRequest):
    """
    Generates structured action plan combining model diagnosis and follow-up questionnaire.
    """
    plan = generate_action_plan(
        predicted_class=req.predicted_class,
        confidence=req.confidence,
        is_healthy=req.is_healthy,
        follow_up_answers=req.follow_up_answers
    )
    return plan

@app.get("/api/scans")
def list_scans():
    """Returns saved farmer scan history."""
    scans = get_all_scans()
    return {"scans": scans}

@app.post("/api/scans")
def record_scan(req: SaveScanRequest):
    """Saves a completed scan and action plan to history."""
    saved = save_scan(req.model_dump())
    return {"success": True, "scan": saved}

@app.delete("/api/scans/{scan_id}")
def remove_scan(scan_id: str):
    """Deletes a previous scan."""
    ok = delete_scan(scan_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Scan not found.")
    return {"success": True, "deleted_id": scan_id}

@app.post("/api/feedback")
def submit_farmer_feedback(req: FeedbackRequest):
    """Saves farmer validation feedback for adaptive continuous learning."""
    saved = save_feedback(req.model_dump())
    return {"success": True, "feedback": saved}

@app.get("/api/weather")
def get_weather(location: str = "Hyderabad, Telangana", lat: Optional[float] = None, lon: Optional[float] = None):
    """Provides agro-meteorological conditions and disease risk indexing."""
    weather = get_weather_data(location=location, lat=lat, lon=lon)
    return weather

@app.get("/api/translations")
def get_translations():
    """Returns UI translation dictionaries for English, Telugu, and Hindi."""
    return TRANSLATIONS

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
