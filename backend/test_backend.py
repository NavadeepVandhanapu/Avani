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

def test_user_corn_leaf_regression():
    import os
    test_img_path = r"C:\Users\91863\.gemini\antigravity-ide\brain\ea173fb8-3663-4e94-a8e9-1c563091e8ab\.user_uploaded\media_1791564402577.jpg"
    if os.path.exists(test_img_path):
        with open(test_img_path, "rb") as f:
            img_bytes = f.read()
        res = classifier.predict(img_bytes)
        assert res["success"] is True
        assert res["is_leaf_detected"] is True
        assert res["is_healthy"] is False
        assert "Corn" in res["crop"]
        assert "Gray Leaf Spot" in res["condition"] or "Cercospora" in res["condition"]
        assert res["confidence"] >= 0.70

def test_uncertainty_safeguard_never_marks_healthy():
    # Test that when is_uncertain is forced or confidence is low, healthy is never emitted
    from PIL import Image
    import numpy as np
    # Slightly ambiguous foliage
    img = Image.new("RGB", (224, 224), (100, 140, 80))
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    res = classifier.predict(buf.getvalue())
    if res["is_uncertain"]:
        assert res["is_healthy"] is False
        assert res["predicted_class"] != "Tomato___healthy"

