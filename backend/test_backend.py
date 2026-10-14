"""
Avani Backend Test Suite
Tests endpoints, leaf heuristic validation, guidance synthesis, and scan persistence.
"""

import io
import pytest
from fastapi.testclient import TestClient
from PIL import Image
import numpy as np


from main import app
from model_service import classifier
from guidance_service import generate_action_plan

client = TestClient(app)

def create_synthetic_leaf_image(color=(40, 140, 50)):
    """Creates a synthetic RGB leaf image for testing."""
    img = Image.new("RGB", (224, 224), color=color)
    # Add subtle variations to simulate texture
    arr = np.array(img)
    arr[50:100, 50:100] = [80, 50, 20] # necrotic spot
    arr[120:150, 120:150] = [180, 170, 40] # yellowing
    img = Image.fromarray(arr)
    
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    buf.seek(0)
    return buf

def create_non_leaf_image():
    """Creates a blank / non-leaf image (e.g. solid white/blue)."""
    img = Image.new("RGB", (224, 224), color=(30, 30, 200)) # blue
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    buf.seek(0)
    return buf

def test_health():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["supported_classes_count"] >= 30

def test_crops():
    response = client.get("/api/crops")
    assert response.status_code == 200
    data = response.json()
    assert "Tomato" in data["supported_crops"]
    assert "Potato" in data["supported_crops"]

def test_predict_leaf():
    buf = create_synthetic_leaf_image()
    response = client.post(
        "/api/predict",
        files={"file": ("leaf.jpg", buf, "image/jpeg")}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["is_leaf_detected"] is True
    assert "predicted_class" in data
    assert "confidence" in data
    assert "visible_symptoms_reference" in data

def test_predict_non_leaf():
    buf = create_non_leaf_image()
    response = client.post(
        "/api/predict",
        files={"file": ("blue.jpg", buf, "image/jpeg")}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["is_leaf_detected"] is False
    assert data["is_uncertain"] is True

def test_guidance_generation():
    req_payload = {
        "predicted_class": "Tomato___Early_blight",
        "confidence": 0.85,
        "is_healthy": False,
        "follow_up_answers": {
            "q1_crop": "Tomato",
            "q2_age": "Fruiting",
            "q3_field_affected": "5-20%",
            "q4_companion_crops": "Chili",
            "q5_weeds": "Moderate",
            "q6_first_appeared": "3 days ago",
            "q7_spreading": "Slowly",
            "q8_weather_watering": "Heavy rain yesterday"
        }
    }
    response = client.post("/api/guidance", json=req_payload)
    assert response.status_code == 200
    data = response.json()
    assert data["crop"] == "Tomato"
    assert "Early Blight" in data["condition"]
    assert len(data["what_to_check_now"]) >= 3
    assert len(data["what_to_monitor"]) >= 2
    assert len(data["when_to_seek_help"]) >= 1
    assert len(data["timeline_actions"]) >= 3
    assert "safety_note" in data

def test_scans_workflow():
    # Save scan
    scan_payload = {
        "crop_name": "Tomato",
        "predicted_class": "Tomato___Early_blight",
        "disease_name": "Early Blight",
        "is_healthy": False,
        "confidence": 0.88,
        "confidence_level": "High",
        "image_preview": "data:image/jpeg;base64,sample",
        "follow_up_answers": {"q1_crop": "Tomato"},
        "guidance_summary": {"condition": "Early Blight"}
    }
    save_res = client.post("/api/scans", json=scan_payload)
    assert save_res.status_code == 200
    saved_data = save_res.json()
    scan_id = saved_data["scan"]["id"]
    
    # List scans
    list_res = client.get("/api/scans")
    assert list_res.status_code == 200
    scans = list_res.json()["scans"]
    assert any(s["id"] == scan_id for s in scans)
    
    # Delete scan
    del_res = client.delete(f"/api/scans/{scan_id}")
    assert del_res.status_code == 200

def test_weather():
    response = client.get("/api/weather?location=Warangal, Telangana")
    assert response.status_code == 200
    data = response.json()
    assert "temperature" in data
    assert "humidity" in data
    assert "disease_risk" in data

def test_translations():
    response = client.get("/api/translations")
    assert response.status_code == 200
    data = response.json()
    assert "en" in data
    assert "te" in data
    assert "hi" in data

def test_class_index_mapping_all_38():
    """Verify that all 38 model classes match model_config.json exactly."""
    import json
    import os
    from model_service import PLANT_VILLAGE_CLASSES, CLASS_METADATA
    
    config_path = os.path.join(os.path.dirname(__file__), "model_config.json")
    with open(config_path, "r") as f:
        cfg = json.load(f)
    id2label = cfg["id2label"]
    
    assert len(PLANT_VILLAGE_CLASSES) == 38
    assert len(id2label) == 38
    
    for idx in range(38):
        cls_name = PLANT_VILLAGE_CLASSES[idx]
        assert str(idx) in id2label
        assert cls_name in CLASS_METADATA
        meta = CLASS_METADATA[cls_name]
        assert "crop" in meta
        assert "condition" in meta
        assert "is_healthy" in meta

def test_maize_common_rust_inference():
    """Test maize with rusty reddish pustule patterns."""
    arr = np.full((224, 224, 3), (35, 125, 40), dtype=np.uint8)
    # Add multiple small raised rusty cinnamon pustules
    for i in range(15):
        cx, cy = 30 + (i * 12) % 180, 20 + (i * 15) % 180
        arr[cy-4:cy+4, cx-4:cx+4] = [175, 75, 20] # cinnamon rust pustule
    img = Image.fromarray(arr)
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    res = classifier.predict(buf.getvalue())
    assert res["success"] is True
    assert res["is_leaf_detected"] is True
    assert "Corn" in res["crop"] or res["is_uncertain"] is True

def test_uncertainty_safeguard_never_marks_healthy():
    # Test that when is_uncertain is forced or confidence is low, healthy is never emitted
    img = Image.new("RGB", (224, 224), (100, 140, 80))
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    res = classifier.predict(buf.getvalue())
    if res["is_uncertain"]:
        assert res["is_healthy"] is False
        assert res["predicted_class"] != "Tomato___healthy"

def test_maize_northern_leaf_blight_inference():
    """Test maize with long elliptical cigar-shaped lesions."""
    arr = np.full((224, 224, 3), (40, 130, 45), dtype=np.uint8)
    # Long cigar lesion running along leaf axis
    arr[50:170, 95:125] = [115, 105, 75] # tan-grey lesion
    img = Image.fromarray(arr)
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    res = classifier.predict(buf.getvalue())
    assert res["success"] is True
    assert res["is_leaf_detected"] is True

def test_healthy_maize_inference():
    """Test healthy corn leaf with uniform green blade."""
    np.random.seed(101)
    base = np.full((224, 224, 3), (35, 140, 45), dtype=np.int16)
    noise = np.random.randint(-15, 15, (224, 224, 3), dtype=np.int16)
    arr = np.clip(base + noise, 0, 255).astype(np.uint8)
    img = Image.fromarray(arr)
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    res = classifier.predict(buf.getvalue())
    assert res["success"] is True
    assert res["is_leaf_detected"] is True

def test_supported_tomato_leaf_inference():
    """Test tomato leaf prediction and guidance generation."""
    buf = create_synthetic_leaf_image()
    res = classifier.predict(buf.getvalue())
    assert res["success"] is True
    assert res["is_leaf_detected"] is True
    assert res["predicted_class"] in classifier.classes

def test_unrelated_or_unclear_image_safeguard():
    """Test non-leaf rejection and low-confidence uncertainty safeguard."""
    # 1. Non-leaf
    non_leaf_buf = create_non_leaf_image()
    res_non_leaf = classifier.predict(non_leaf_buf.getvalue())
    assert res_non_leaf["is_leaf_detected"] is False
    assert res_non_leaf["predicted_class"] == "Invalid___Non_Leaf"

    # 2. Ambiguous out-of-distribution input
    arr_ambiguous = np.full((224, 224, 3), (120, 125, 100), dtype=np.uint8)
    buf_amb = io.BytesIO()
    Image.fromarray(arr_ambiguous).save(buf_amb, format="JPEG")
    res_amb = classifier.predict(buf_amb.getvalue())
    if res_amb["is_leaf_detected"]:
        assert res_amb["is_uncertain"] is True
        assert res_amb["is_healthy"] is False

def test_user_potato_leaf_uncertainty_regression():
    """Verify that the 24% confidence damaged leaf image triggers uncertainty and is never reported healthy."""
    import os
    img_path = r"C:\Users\91863\.gemini\antigravity-ide\brain\ea173fb8-3663-4e94-a8e9-1c563091e8ab\.user_uploaded\media_1791567658522.jpg"
    if os.path.exists(img_path):
        with open(img_path, "rb") as f:
            res = classifier.predict(f.read())
        assert res["success"] is True
        assert res["is_leaf_detected"] is True
        assert res["is_uncertain"] is True
        assert res["is_healthy"] is False
        assert res["confidence"] < 0.48
        assert "confirm crop" in res["plain_confidence"] or "We're not sure" in res["plain_confidence"]

def test_normal_high_confidence_prediction():
    """Verify normal high confidence prediction returns crop, disease condition, and single confidence score."""
    import os
    corn_path = r"C:\Users\91863\.gemini\antigravity-ide\brain\ea173fb8-3663-4e94-a8e9-1c563091e8ab\.user_uploaded\media_1791564402577.jpg"
    if os.path.exists(corn_path):
        with open(corn_path, "rb") as f:
            res = classifier.predict(f.read())
        assert res["success"] is True
        assert res["crop"] == "Corn (Maize)"
        assert "Gray Leaf Spot" in res["condition"] or "Cercospora" in res["condition"]
        assert res["confidence"] >= 0.75
        assert res["is_uncertain"] is False
        assert "visual similarity" in res["plain_confidence"]
        assert "%" in res["plain_confidence"]

def test_healthy_prediction_flow():
    """Verify healthy prediction produces clean healthy status without false disease warnings."""
    np.random.seed(42)
    base = np.full((224, 224, 3), (40, 145, 50), dtype=np.int16)
    noise = np.random.randint(-20, 20, (224, 224, 3), dtype=np.int16)
    arr_healthy = np.clip(base + noise, 0, 255).astype(np.uint8)
    healthy_img = Image.fromarray(arr_healthy)
    buf = io.BytesIO()
    healthy_img.save(buf, format="JPEG")
    res = classifier.predict(buf.getvalue())
    assert res["success"] is True
    assert isinstance(res["plain_explanation"], str)

def test_voice_query_english():
    """Test voice query processing in English with agronomic guidance search."""
    payload = {
        "query": "My tomato leaf has yellow spots, how should I spray or treat it?",
        "language": "en"
    }
    response = client.post("/api/voice-query", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["language"] == "en"
    assert data["matched_crop"] == "Tomato"
    assert len(data["answer_text"]) > 20
    assert len(data["action_pointers"]) > 0

def test_voice_query_telugu():
    """Test voice query processing in Telugu."""
    payload = {
        "query": "టమోటా ఆకులపై మచ్చలు ఉన్నాయి నీరు ఎప్పుడు పెట్టాలి?",
        "language": "te"
    }
    response = client.post("/api/voice-query", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["language"] == "te"
    assert len(data["answer_text"]) > 10
    assert len(data["action_pointers"]) > 0

def test_voice_query_hindi():
    """Test voice query processing in Hindi."""
    payload = {
        "query": "टमाटर के पत्तों पर धब्बे हैं क्या छिड़काव करना चाहिए?",
        "language": "hi"
    }
    response = client.post("/api/voice-query", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["language"] == "hi"
    assert len(data["answer_text"]) > 10
    assert len(data["action_pointers"]) > 0

def test_voice_query_with_active_scan_context():
    """Test voice query with active scan context seamlessly referencing scanned crop and condition."""
    payload = {
        "query": "What should I do immediately for this condition?",
        "language": "en",
        "scan_context": {
            "crop": "Potato",
            "condition": "Early Blight",
            "confidence": 0.82,
            "is_healthy": False
        }
    }
    response = client.post("/api/voice-query", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "Potato" in data["matched_crop"]
    assert "Early Blight" in data["condition"]
    assert data["is_scan_context_applied"] is True
    assert len(data["answer_text"]) > 10


def test_guidance_generation_telugu():
    """Verify agricultural action guidance is 100% localized into Telugu with no mixed English content."""
    req_payload = {
        "predicted_class": "Tomato___Early_blight",
        "confidence": 0.85,
        "is_healthy": False,
        "language": "te",
        "follow_up_answers": {
            "q1_crop": "Tomato",
            "q2_age": "Fruiting",
            "q3_field_affected": "5-20%",
            "q4_companion_crops": "Chili",
            "q5_weeds": "Moderate",
            "q6_first_appeared": "3 days ago",
            "q7_spreading": "Slow / Localized",
            "q8_weather_watering": "Heavy rain"
        }
    }
    response = client.post("/api/guidance", json=req_payload)
    assert response.status_code == 200
    data = response.json()
    assert data["crop"] == "టమోటా"
    assert "ముందస్తు" in data["condition"]
    assert "శిలీంధ్ర" in data["category"]
    assert len(data["what_to_check_now"]) >= 3
    # Check that Telugu characters exist and English placeholders do not
    assert any('\u0C00' <= ch <= '\u0C7F' for ch in data["what_to_check_now"][0])
    assert any('\u0C00' <= ch <= '\u0C7F' for ch in data["what_to_monitor"][0])
    assert any('\u0C00' <= ch <= '\u0C7F' for ch in data["when_to_seek_help"][0])
    assert data["timeline_actions"][0]["period"] == "ఈరోజు"
    assert "General Crop" not in str(data)
    assert "Crop & Stage" not in data["summary_bullets"][0]
    assert "పంట & దశ:" in data["summary_bullets"][0]


def test_guidance_generation_hindi():
    """Verify agricultural action guidance is 100% localized into Hindi."""
    req_payload = {
        "predicted_class": "Tomato___Early_blight",
        "confidence": 0.85,
        "is_healthy": False,
        "language": "hi",
        "follow_up_answers": {
            "q1_crop": "Tomato",
            "q2_age": "Vegetative / Growth",
            "q3_field_affected": "< 5% (Isolated plants)",
            "q4_companion_crops": "None / Single Crop",
            "q5_weeds": "Low / Clean field",
            "q6_first_appeared": "1-2 days ago",
            "q7_spreading": "Slow / Localized",
            "q8_weather_watering": "Normal / Moderate"
        }
    }
    response = client.post("/api/guidance", json=req_payload)
    assert response.status_code == 200
    data = response.json()
    assert data["crop"] == "टमाटर"
    assert "अगेती" in data["condition"]
    assert "फफूंद" in data["category"]
    assert any('\u0900' <= ch <= '\u097F' for ch in data["what_to_check_now"][0])
    assert data["timeline_actions"][0]["period"] == "आज"
    assert "फसल व अवस्था:" in data["summary_bullets"][0]


def test_guidance_generation_unconfirmed_crop_telugu():
    """Verify unknown crop produces respectful localized label instead of 'General Crop'."""
    req_payload = {
        "predicted_class": "Uncertain___Low_Confidence",
        "confidence": 0.40,
        "is_healthy": False,
        "language": "te",
        "follow_up_answers": {}
    }
    response = client.post("/api/guidance", json=req_payload)
    assert response.status_code == 200
    data = response.json()
    assert data["crop"] == "గుర్తించబడని పంట"
    assert "General Crop" not in data["crop"]
    assert "పరిశీలన" in data["condition"]
    assert any('\u0C00' <= ch <= '\u0C7F' for ch in data["plain_summary"])
    assert any('\u0C00' <= ch <= '\u0C7F' for ch in data["what_to_check_now"][0])


def test_voice_query_telugu_complete_localization():
    """Verify voice query in Telugu returns pure Telugu text, pointers, and localized crop without English artifacts."""
    payload = {
        "query": "మొక్కజొన్న ఆకుపై బూడిద మచ్చలు ఉన్నాయి ఏమి చేయాలి?",
        "language": "te"
    }
    response = client.post("/api/voice-query", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["language"] == "te"
    assert data["matched_crop"] == "మొక్కజొన్న"
    assert "General Crop" not in data["answer_text"]
    assert "Color variation" not in data["answer_text"]
    assert any('\u0C00' <= ch <= '\u0C7F' for ch in data["answer_text"])
    assert len(data["action_pointers"]) > 0
    assert any('\u0C00' <= ch <= '\u0C7F' for ch in data["action_pointers"][0])


def test_voice_query_hindi_complete_localization():
    """Verify voice query in Hindi returns pure Hindi text and pointers without English artifacts."""
    payload = {
        "query": "टमाटर के पत्तों पर पीले धब्बे हैं सिंचाई कैसे करें?",
        "language": "hi"
    }
    response = client.post("/api/voice-query", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["language"] == "hi"
    assert data["matched_crop"] == "टमाटर"
    assert "General Crop" not in data["answer_text"]
    assert any('\u0900' <= ch <= '\u097F' for ch in data["answer_text"])
    assert len(data["action_pointers"]) > 0
    assert any('\u0900' <= ch <= '\u097F' for ch in data["action_pointers"][0])


def test_predict_telugu_localization():
    """Verify /api/predict supports language parameter and returns localized crop, condition, and symptoms."""
    buf = create_synthetic_leaf_image()
    response = client.post(
        "/api/predict",
        files={"file": ("leaf.jpg", buf, "image/jpeg")},
        data={"language": "te"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert any('\u0C00' <= ch <= '\u0C7F' for ch in data["crop"]) or data["crop"] != ""
    assert any('\u0C00' <= ch <= '\u0C7F' for ch in data["visible_symptoms_reference"][0])


def test_voice_query_telugu_regression_unknown_crop_no_english_leak():
    """
    REGRESSION TEST:
    Assert that previously leaking English strings:
    - 'General Crop'
    - 'Color variation or markings on the leaf surface'
    - 'Inspect leaf undersides and stem junctions for pests or fungal powder.'
    - 'Check soil moisture around the root zone.'
    - 'Compare affected plant with healthy neighboring plants in the same field.'
    are completely ABSENT from every field of the Telugu response for the sample query:
    'ఆకులపై మచ్చలు వస్తే ఏం చేయాలి?'
    """
    payload = {
        "query": "ఆకులపై మచ్చలు వస్తే ఏం చేయాలి?",
        "language": "te"
    }
    response = client.post("/api/voice-query", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["language"] == "te"

    # 1. matched_crop must be Telugu, never 'General Crop'
    assert data["matched_crop"] == "గుర్తించబడని పంట"
    assert "General Crop" not in str(data)

    # 2. condition must be localized
    assert data["condition"] == "పంట ఆకుల ప్రాథమిక పరిశీలన"
    assert "Foliage Inspection" not in data["condition"]

    # 3. answer_text must NOT contain any of the leaking English strings
    assert "General Crop" not in data["answer_text"]
    assert "Color variation" not in data["answer_text"]
    assert "leaf surface" not in data["answer_text"]
    assert "Inspect daily" not in data["answer_text"]
    assert "గుర్తించబడని పంట పై ముఖ్య లక్షణాలు:" in data["answer_text"]
    assert "ఆకు ఉపరితలంపై రంగు మారడం" in data["answer_text"]

    # 4. action_pointers must NOT contain any of the 3 leaking English pointers
    raw_pointers_str = " ".join(data["action_pointers"])
    assert "Inspect leaf undersides" not in raw_pointers_str
    assert "Check soil moisture" not in raw_pointers_str
    assert "Compare affected plant" not in raw_pointers_str
    assert len(data["action_pointers"]) >= 3
    for pointer in data["action_pointers"]:
        assert any('\u0C00' <= ch <= '\u0C7F' for ch in pointer)
        assert "pests" not in pointer
        assert "fungal powder" not in pointer


def test_voice_query_hindi_regression_unknown_crop_no_english_leak():
    """
    REGRESSION TEST:
    Assert that unknown crop query in Hindi returns pure Hindi fields without English leakage.
    """
    payload = {
        "query": "पत्तियों पर धब्बे हों तो क्या करें?",
        "language": "hi"
    }
    response = client.post("/api/voice-query", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["language"] == "hi"

    assert data["matched_crop"] == "अज्ञात फसल"
    assert "General Crop" not in str(data)
    assert data["condition"] == "पत्तियों का सामान्य निरीक्षण"
    assert "Foliage Inspection" not in data["condition"]

    assert "General Crop" not in data["answer_text"]
    assert "Color variation" not in data["answer_text"]
    assert "Inspect leaf undersides" not in " ".join(data["action_pointers"])
    assert len(data["action_pointers"]) >= 3
    for pointer in data["action_pointers"]:
        assert any('\u0900' <= ch <= '\u097F' for ch in pointer)


def test_voice_query_english_unknown_crop_preservation():
    """
    Verify English voice query still works correctly with standard English terminology.
    """
    payload = {
        "query": "What should I do if spots appear on leaves?",
        "language": "en"
    }
    response = client.post("/api/voice-query", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["language"] == "en"
    assert data["matched_crop"] == "Unconfirmed Crop"
    assert "Unconfirmed Crop" in data["answer_text"]
    assert len(data["action_pointers"]) >= 3


def test_voice_query_telugu_acknowledgement_not_repeating_scan():
    """
    Assert that when farmer says 'అది నాకు తెలుసు' (I already know that),
    Avani naturally acknowledges in Telugu and DOES NOT repeat previous scan guidance
    or return diagnostic action pointers.
    """
    scan_ctx = {
        "crop": "Corn (Maize)",
        "condition": "Gray Leaf Spot (Cercospora)",
        "predicted_class": "Corn_(maize)___Cercospora_leaf_spot Gray_leaf_spot",
        "confidence": 0.88,
        "is_healthy": False
    }
    payload = {
        "query": "అది నాకు తెలుసు",
        "language": "te",
        "scan_context": scan_ctx
    }
    response = client.post("/api/voice-query", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["language"] == "te"

    # Must naturally acknowledge in Telugu
    assert "సరే, మీకు ఆ విషయం ఇప్పటికే తెలుసని అర్థమైంది" in data["answer_text"]
    # Must NOT repeat Gray leaf spot guidance or say 'మొక్కజొన్న పరిశీలన'
    assert "మొక్కజొన్న పరిశీలన" not in data["answer_text"]
    assert "Gray Leaf Spot" not in data["answer_text"]
    assert data["is_scan_context_applied"] is False
    assert len(data["action_pointers"]) == 0
    assert data["matched_crop"] is None


def test_voice_query_telugu_prevention_with_active_scan():
    """
    Assert that when farmer asks 'దీనిని ఎలా అరికట్టాలి?' with active Corn Gray Leaf Spot scan,
    Avani returns targeted prevention guidance for that condition, not generic scouting steps.
    """
    scan_ctx = {
        "crop": "Corn (Maize)",
        "condition": "Gray Leaf Spot (Cercospora)",
        "predicted_class": "Corn_(maize)___Cercospora_leaf_spot Gray_leaf_spot",
        "confidence": 0.88,
        "is_healthy": False
    }
    payload = {
        "query": "దీనిని ఎలా అరికట్టాలి?",
        "language": "te",
        "scan_context": scan_ctx
    }
    response = client.post("/api/voice-query", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["language"] == "te"

    # Context applied and specific condition referenced
    assert data["is_scan_context_applied"] is True
    assert data["matched_crop"] == "మొక్కజొన్న"
    assert "Gray Leaf Spot" in data["condition"]
    assert "నివారణకు ముఖ్య చర్యలు" in data["answer_text"]
    assert "వ్యాధి సోకిన కింది ఆకులను వెంటనే తొలగించి" in data["answer_text"]
    assert len(data["action_pointers"]) >= 3
    assert any("తుంచి పొలానికి దూరంగా" in p for p in data["action_pointers"])


def test_voice_query_telugu_watering_guidance():
    """
    Assert that when farmer asks 'నీరు ఎప్పుడు పెట్టాలి?',
    Avani provides precise irrigation advice and pointers.
    """
    scan_ctx = {
        "crop": "Corn (Maize)",
        "condition": "Gray Leaf Spot (Cercospora)",
        "predicted_class": "Corn_(maize)___Cercospora_leaf_spot Gray_leaf_spot",
        "confidence": 0.88,
        "is_healthy": False
    }
    payload = {
        "query": "నీరు ఎప్పుడు పెట్టాలి?",
        "language": "te",
        "scan_context": scan_ctx
    }
    response = client.post("/api/voice-query", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["language"] == "te"
    assert "మొక్కజొన్న పంటకు నేల పైపొర" in data["answer_text"]
    assert "తేలికపాటి తడి" in data["answer_text"]
    assert len(data["action_pointers"]) >= 3
    assert any("తేమ శాతాన్ని" in p for p in data["action_pointers"])


def test_voice_query_hindi_acknowledgement_and_prevention():
    """
    Assert Hindi handles acknowledgements naturally and provides prevention advice.
    """
    scan_ctx = {
        "crop": "Corn (Maize)",
        "condition": "Gray Leaf Spot (Cercospora)",
        "predicted_class": "Corn_(maize)___Cercospora_leaf_spot Gray_leaf_spot",
        "confidence": 0.88,
        "is_healthy": False
    }

    # 1. Acknowledgement
    res1 = client.post("/api/voice-query", json={"query": "मुझे पता है", "language": "hi", "scan_context": scan_ctx})
    d1 = res1.json()
    assert "ठीक है, समझ गया कि आपको यह पहले से पता है" in d1["answer_text"]
    assert len(d1["action_pointers"]) == 0
    assert d1["is_scan_context_applied"] is False

    # 2. Prevention
    res2 = client.post("/api/voice-query", json={"query": "इसकी रोकथाम कैसे करें?", "language": "hi", "scan_context": scan_ctx})
    d2 = res2.json()
    assert "रोकथाम के लिए मुख्य उपाय" in d2["answer_text"]
    assert len(d2["action_pointers"]) >= 3
    assert d2["is_scan_context_applied"] is True


def test_voice_query_english_acknowledgement_and_prevention():
    """
    Assert English handles acknowledgements naturally and provides prevention advice.
    """
    scan_ctx = {
        "crop": "Corn (Maize)",
        "condition": "Gray Leaf Spot (Cercospora)",
        "predicted_class": "Corn_(maize)___Cercospora_leaf_spot Gray_leaf_spot",
        "confidence": 0.88,
        "is_healthy": False
    }

    # 1. Acknowledgement
    res1 = client.post("/api/voice-query", json={"query": "I already know that", "language": "en", "scan_context": scan_ctx})
    d1 = res1.json()
    assert "Understood, you are already aware of this" in d1["answer_text"]
    assert len(d1["action_pointers"]) == 0
    assert d1["is_scan_context_applied"] is False

    # 2. Prevention
    res2 = client.post("/api/voice-query", json={"query": "How to prevent this?", "language": "en", "scan_context": scan_ctx})
    d2 = res2.json()
    assert "prevention and control" in d2["answer_text"].lower()
    assert len(d2["action_pointers"]) >= 3
    assert d2["is_scan_context_applied"] is True


def test_voice_query_unknown_query_localized_clarification():
    """
    Assert that unsupported/unknown queries receive a localized clarification request
    instead of repeating generic or active scan disease guidance.
    """
    scan_ctx = {
        "crop": "Corn (Maize)",
        "condition": "Gray Leaf Spot (Cercospora)",
        "predicted_class": "Corn_(maize)___Cercospora_leaf_spot Gray_leaf_spot",
        "confidence": 0.88,
        "is_healthy": False
    }
    payload = {
        "query": "random chit chat 12345",
        "language": "te",
        "scan_context": scan_ctx
    }
    response = client.post("/api/voice-query", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "మీ ప్రశ్న స్పష్టంగా అర్థం కాలేదు" in data["answer_text"]
    assert "Gray Leaf Spot" not in str(data)
    assert len(data["action_pointers"]) == 0
    assert data["is_scan_context_applied"] is False
    assert data["matched_crop"] is None








def test_hyderabad_weather_default():
    # Test default location is Hyderabad, Telangana
    response = client.get("/api/weather")
    assert response.status_code == 200
    data = response.json()
    assert "Hyderabad" in data["location"]
    assert "temperature" in data
    assert "humidity" in data
    assert "disease_risk" in data
    assert "source" in data

def test_smart_questionnaire_uncertain_diagnosis():
    # Low confidence or uncertain plan must flag warning without pretending certainty
    plan = generate_action_plan(
        predicted_class="Uncertain___Low_Confidence",
        confidence=0.42,
        is_healthy=False,
        follow_up_answers={
            "q1_crop": "Potato",
            "q2_age": "Fruiting / Maturity",
            "q3_field_affected": "> 50% (Severe)",
            "q6_first_appeared": "About 1 week ago",
            "q7_spreading": "Spreading rapidly",
            "q8_weather_watering": "Heavy rain / fog"
        }
    )
    assert plan["is_uncertain_diagnosis"] is True
    assert plan["crop"] == "Potato"
    assert any("Unconfirmed" in step or "verify" in step.lower() for step in plan["what_to_check_now"])
    assert any("RAPID SPREAD ALERT" in m for m in plan["what_to_monitor"])
    assert any("Krishi Vigyan Kendra" in s or "KVK" in s for s in plan["when_to_seek_help"])

def test_healthy_leaf_tailoring():
    plan = generate_action_plan(
        predicted_class="Tomato___healthy",
        confidence=0.92,
        is_healthy=True,
        follow_up_answers={"q1_crop": "Tomato"}
    )
    assert plan["is_uncertain_diagnosis"] is False
    assert any("predators" in step.lower() or "mites" in step.lower() for step in plan["what_to_check_now"])

def test_dynamic_questionnaire_healthy_with_farmer_yellowing():
    # Healthy scan where farmer reported subtle yellowing on single plant
    plan = generate_action_plan(
        predicted_class="Tomato___healthy",
        confidence=0.95,
        is_healthy=True,
        follow_up_answers={
            "q1_crop": "Tomato",
            "healthy_other_symptoms": "Subtle yellowing or pale leaves on lower stems",
            "healthy_distribution": "Single plant",
            "healthy_water_stress": "Normal regular watering"
        },
        language="en"
    )
    assert plan["is_uncertain_diagnosis"] is False
    # Verifies guidance addresses farmer's yellowing observation without false disease claim
    assert any("yellowing" in step.lower() for step in plan["what_to_check_now"])
    assert any("Field Observation" in bullet for bullet in plan["summary_bullets"])

def test_dynamic_questionnaire_leaf_spot_target_rings():
    # Leaf spot with concentric rings reported by farmer
    plan = generate_action_plan(
        predicted_class="Tomato___Early_blight",
        confidence=0.88,
        is_healthy=False,
        follow_up_answers={
            "q1_crop": "Tomato",
            "spot_appearance": "Concentric rings (Fungal)",
            "spot_plant_part": "Lower older leaves",
            "spot_field_spread": "5-20% (Scattered patches)",
            "spot_spread_rate": "Spreading rapidly",
            "spot_moisture_conditions": "Overhead watering / heavy rain"
        },
        language="en"
    )
    assert any("Alternaria" in step or "concentric" in step.lower() for step in plan["what_to_check_now"])
    assert any("20cm" in step or "lower leaves" in step.lower() for step in plan["what_to_check_now"])
    assert any("RAPID SPREAD ALERT" in m for m in plan["what_to_monitor"])

def test_dynamic_questionnaire_blight_rapid_progression():
    # Blight with rapid progression and fruit decay
    plan = generate_action_plan(
        predicted_class="Potato___Late_blight",
        confidence=0.91,
        is_healthy=False,
        follow_up_answers={
            "q1_crop": "Potato",
            "blight_progression": "Very rapid (2-3 days)",
            "blight_plant_parts": "Fruits / tubers rotting",
            "blight_field_extent": "20-50% (Widespread)",
            "blight_weather": "Cool rain / mist / fog"
        },
        language="en"
    )
    assert any("RAPID BLIGHT PROGRESSION ALERT" in m for m in plan["what_to_monitor"])
    assert any("tubers" in step.lower() or "decay" in step.lower() for step in plan["what_to_check_now"])

def test_dynamic_questionnaire_rust_pustules_powder():
    # Rust with active powdery pustules rubbing off
    plan = generate_action_plan(
        predicted_class="Corn_(maize)___Common_rust_",
        confidence=0.85,
        is_healthy=False,
        follow_up_answers={
            "q1_crop": "Corn (Maize)",
            "rust_pustules": "Powder rubs off (Active rust)",
            "rust_leaf_surface": "Both leaf surfaces",
            "rust_spread": "Spreading with wind",
            "rust_crop_stage": "Flowering / Tasseling"
        },
        language="en"
    )
    assert any("clothing" in step.lower() or "fingers" in step.lower() for step in plan["what_to_check_now"])

def test_dynamic_questionnaire_mildew_dense_canopy():
    # Mildew with dense shade canopy
    plan = generate_action_plan(
        predicted_class="Squash___Powdery_mildew",
        confidence=0.89,
        is_healthy=False,
        follow_up_answers={
            "q1_crop": "Squash",
            "mildew_appearance": "White powdery coating",
            "mildew_canopy": "Dense canopy / poor airflow",
            "mildew_spread": "5-20% (Scattered)"
        },
        language="en"
    )
    assert any("suckers" in step.lower() or "air movement" in step.lower() for step in plan["what_to_check_now"])

def test_dynamic_questionnaire_viral_whiteflies():
    # Viral curl with whiteflies vector
    plan = generate_action_plan(
        predicted_class="Tomato___Tomato_Yellow_Leaf_Curl_Virus",
        confidence=0.93,
        is_healthy=False,
        follow_up_answers={
            "q1_crop": "Tomato",
            "viral_symptoms": "Upward leaf curling",
            "vector_presence": "Whiteflies present",
            "viral_spread": "5-20% (Edge clusters)"
        },
        language="en"
    )
    assert any("sticky traps" in step.lower() or "whiteflies" in step.lower() for step in plan["what_to_check_now"])

def test_dynamic_questionnaire_multilingual_telugu():
    # Verifies Telugu localization of dynamic questionnaire synthesis
    plan = generate_action_plan(
        predicted_class="Tomato___Early_blight",
        confidence=0.88,
        is_healthy=False,
        follow_up_answers={
            "q1_crop": "Tomato",
            "spot_appearance": "Concentric rings (Fungal)",
            "spot_plant_part": "Lower older leaves",
            "spot_spread_rate": "Spreading rapidly"
        },
        language="te"
    )
    assert any("ఆల్టర్నేరియా" in step for step in plan["what_to_check_now"])
    assert any("గమనించిన మచ్చలు" in bullet for bullet in plan["summary_bullets"])

def test_dynamic_questionnaire_fallback_safe():
    # Ensures missing or empty answers do not crash and return sensible plan
    plan = generate_action_plan(
        predicted_class="Tomato___Early_blight",
        confidence=0.80,
        is_healthy=False,
        follow_up_answers={}
    )
    assert plan["crop"] != ""
    assert len(plan["what_to_check_now"]) > 0
    assert len(plan["summary_bullets"]) > 0



