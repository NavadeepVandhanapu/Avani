"""
Avani Backend FastAPI Application
AI-Powered Crop Disease Detection & Action Support Platform
"""

import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, File, UploadFile, Form, HTTPException, Query
from fastapi.responses import Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, Any, List, Optional
import json

from model_service import classifier, CLASS_METADATA, PLANT_VILLAGE_CLASSES
from guidance_service import generate_action_plan
from guidance_data import GUIDANCE_DATABASE
from guidance_translations import (
    get_localized_crop,
    get_localized_condition,
    get_localized_guidance_entry
)
from database import init_db, save_scan, get_all_scans, delete_scan
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
    language: str = "en"

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
async def predict_image(
    file: UploadFile = File(...),
    language: Optional[str] = Form("en")
):
    """
    Receives leaf photograph, validates image format and leaf characteristics,
    and runs genuine computer vision inference. Returns localized results when requested.
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
    is_uncertain = result.get("is_uncertain", False)
    lang = language if language in ["en", "te", "hi"] else "en"
    
    if is_uncertain:
        if lang == "te":
            result["visible_symptoms_reference"] = [
                "బాధిత ఆకుల స్థానాన్ని గమనించండి: మచ్చలు ప్రధానంగా కింది లేదా పై ఆకులపై ఉన్నాయా?",
                "పొలమంతా పరిశీలించి ఇతర మొక్కలకు కూడా ఈ లక్షణాలు సోకాయో లేదో తనిఖీ చేయండి.",
                "కాండం మరియు వేరు భాగంలో నీటి నిల్వ, కుళ్ళు లేదా పురుగుల దాడి సంకేతాలను పరిశీలించండి.",
                "ఖచ్చితమైన సలహాల కోసం మీ పంట రకాన్ని నిర్ధారించండి."
            ]
            result["crop"] = get_localized_crop("Unconfirmed Crop", "te")
            result["condition"] = get_localized_condition("Inconclusive Observation", "te")
            result["plain_explanation"] = "ఆకు వివరాలు కనిపిస్తున్నాయి, కానీ పంట రకం లేదా తెగులు ఖచ్చితంగా నిర్ధారించబడలేదు. తదుపరి ప్రశ్నలకు సమాధానం ఇవ్వడం ద్వారా కార్యాచరణ ప్రణాళిక పొందవచ్చు."
            score_pct = int(round(result.get("confidence", 0.5) * 100))
            result["plain_confidence"] = f"సమస్య ఖచ్చితంగా నిర్ధారించబడలేదు ({score_pct}% దృశ్య పోలిక) — దయచేసి పంటను ఎంచుకోండి"
        elif lang == "hi":
            result["visible_symptoms_reference"] = [
                "देखें कि धब्बे मुख्य रूप से निचली पत्तियों पर हैं या नई पत्तियों पर।",
                "पूरे खेत का चक्कर लगाकर देखें कि क्या अन्य पौधों में भी यही समस्या है।",
                "तने और जड़ों के पास जलभराव अथवा कीटों की उपस्थिति की जांच करें।",
                "सटीक सलाह के लिए अपनी फसल की पुष्टि करें।"
            ]
            result["crop"] = get_localized_crop("Unconfirmed Crop", "hi")
            result["condition"] = get_localized_condition("Inconclusive Observation", "hi")
            result["plain_explanation"] = "पत्ती के लक्षण दिखाई दे रहे हैं, लेकिन फसल या रोग की पुष्टि पूरी तरह नहीं हुई है। खेत के सवालों के जवाब देकर सही कदम जानें।"
            score_pct = int(round(result.get("confidence", 0.5) * 100))
            result["plain_confidence"] = f"रोग की पुष्टि निश्चित नहीं है ({score_pct}% दृश्य समानता) — कृपया फसल चुनें"
        else:
            result["visible_symptoms_reference"] = [
                "Observe the location of leaf damage: check whether necrotic spots or leaf margin drying appear mainly on lower or upper leaves.",
                "Inspect neighboring plants across the field to see if similar discoloration is isolated or spreading.",
                "Examine stems and root collar for signs of waterlogging, rot, or insect pest activity.",
                "Confirm your crop species in the questionnaire to receive crop-tailored management steps."
            ]
        result["scientific_name"] = ""
    elif pred_cls in GUIDANCE_DATABASE:
        loc_entry = get_localized_guidance_entry(pred_cls, GUIDANCE_DATABASE[pred_cls], language=lang)
        result["visible_symptoms_reference"] = loc_entry.get("visible_symptoms", [])
        result["scientific_name"] = GUIDANCE_DATABASE[pred_cls].get("scientific_name", "")
        if lang != "en":
            result["crop"] = get_localized_crop(result["crop"], language=lang)
            result["condition"] = get_localized_condition(result["condition"], language=lang)
            score_pct = int(round(result.get("confidence", 0.8) * 100))
            if result.get("is_healthy"):
                if lang == "te":
                    result["plain_explanation"] = "ఈ ఫోటోలోని ఆకు సాధారణ ఆకుపచ్చ రంగుతో ఆరోగ్యంగా కనిపిస్తోంది. స్పష్టమైన తెగులు లక్షణాలు ఏవీ కనిపించలేదు."
                    result["plain_confidence"] = f"ఫోటో ఆరోగ్యకరమైన ఆకులను పోలి ఉంది ({score_pct}% పోలిక)"
                else:
                    result["plain_explanation"] = "इस फोटो में पत्ती सामान्य हरे रंग के साथ स्वस्थ दिखाई दे रही है। किसी स्पष्ट रोग के लक्षण नहीं दिखे हैं।"
                    result["plain_confidence"] = f"फोटो स्वस्थ फसल से काफी मिलती-जुलती है ({score_pct}% समानता)"
            else:
                if lang == "te":
                    result["plain_explanation"] = f"ఈ ఫోటోలోని దృశ్య లక్షణాలు {result['crop']} పై {result['condition']} ను స్పష్టంగా పోలి ఉన్నాయి."
                    result["plain_confidence"] = f"ఈ వ్యాధి లక్షణాలతో సరిపోలుతోంది ({score_pct}% పోలిక)"
                else:
                    result["plain_explanation"] = f"इस फोटो के लक्षण {result['crop']} पर {result['condition']} से काफी मिलते-जुलते हैं।"
                    result["plain_confidence"] = f"इस रोग के लक्षणों से समानता ({score_pct}% समानता)"
    else:
        if lang == "te":
            result["visible_symptoms_reference"] = [
                "ఆకు రంగు స్థిరత్వం, నిర్మాణం మరియు మచ్చల గుర్తులను గమనించండి."
            ]
            result["crop"] = get_localized_crop(result["crop"], "te")
            result["condition"] = get_localized_condition(result["condition"], "te")
        elif lang == "hi":
            result["visible_symptoms_reference"] = [
                "पत्ती के रंग की एकरूपता, बनावट और धब्बों की उपस्थिति का निरीक्षण करें।"
            ]
            result["crop"] = get_localized_crop(result["crop"], "hi")
            result["condition"] = get_localized_condition(result["condition"], "hi")
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
    Passes requested language for 100% localized output.
    """
    plan = generate_action_plan(
        predicted_class=req.predicted_class,
        confidence=req.confidence,
        is_healthy=req.is_healthy,
        follow_up_answers=req.follow_up_answers,
        language=req.language
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

@app.get("/api/weather")
def get_weather(location: str = "Warangal, Telangana", lat: Optional[float] = None, lon: Optional[float] = None):
    """Provides agro-meteorological conditions and disease risk indexing."""
    weather = get_weather_data(location=location, lat=lat, lon=lon)
    return weather

class VoiceQueryRequest(BaseModel):
    query: str
    language: str = "en"
    scan_context: Optional[Dict[str, Any]] = None

@app.post("/api/voice-query")
def voice_query(req: VoiceQueryRequest):
    """Answers farmer spoken queries in EN/TE/HI using verified guidance and scan context."""
    from voice_service import process_voice_query
    res = process_voice_query(
        query=req.query,
        language=req.language,
        scan_context=req.scan_context
    )
    return res


class TTSRequest(BaseModel):
    text: str
    language: str = "te"

@app.post("/api/tts")
def generate_tts(req: TTSRequest):
    """
    Generates high-fidelity spoken MP3 audio in Telugu, Hindi, or English.
    Provides regional voice synthesis for devices/browsers that do not bundle native voices.
    """
    clean_text = req.text.strip()
    if not clean_text:
        raise HTTPException(status_code=400, detail="Text cannot be empty.")
    
    try:
        from gtts import gTTS
        import io

        # Sanitize language code for gTTS (te, hi, en)
        lang_code = req.language if req.language in ["te", "hi", "en"] else "te"
        # Truncate text if excessively long to prevent timeout (first 400 chars is plenty for verbal response)
        spoken_text = clean_text[:400]
        
        tts = gTTS(text=spoken_text, lang=lang_code, slow=False)
        fp = io.BytesIO()
        tts.write_to_fp(fp)
        fp.seek(0)
        
        return Response(content=fp.read(), media_type="audio/mpeg")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"TTS synthesis error: {str(e)}")



@app.get("/api/translations")
def get_translations():
    """Returns UI translation dictionaries for English, Telugu, and Hindi."""
    return TRANSLATIONS

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
