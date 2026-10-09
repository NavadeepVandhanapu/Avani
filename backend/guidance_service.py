"""
Avani Action-Support Guidance Engine
Generates tailored inspection plans and timelines from model predictions,
questionnaire answers, and curated agricultural references.
"""

from typing import Dict, Any, List
from guidance_data import GUIDANCE_DATABASE, GENERIC_CROP_GUIDANCE

def generate_action_plan(
    predicted_class: str,
    confidence: float,
    is_healthy: bool,
    follow_up_answers: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Synthesizes model diagnosis and 8-question farmer response into a practical action plan.
    """
    # 1. Retrieve base reference
    if predicted_class in GUIDANCE_DATABASE:
        ref = GUIDANCE_DATABASE[predicted_class]
    else:
        # Check by crop prefix
        crop_prefix = predicted_class.split("___")[0]
        matching_key = next((k for k in GUIDANCE_DATABASE.keys() if k.startswith(crop_prefix)), None)
        if matching_key:
            ref = GUIDANCE_DATABASE[matching_key]
        else:
            ref = GENERIC_CROP_GUIDANCE

    # Extract follow-up context
    crop_selected = follow_up_answers.get("q1_crop") or ref.get("crop", "Crop")
    stage = follow_up_answers.get("q2_age", "Vegetative / Growth")
    affected_pct = follow_up_answers.get("q3_field_affected", "< 5% (Isolated plants)")
    companion_crops = follow_up_answers.get("q4_companion_crops", "None / Single Crop")
    weeds = follow_up_answers.get("q5_weeds", "Low / Clean field")
    first_noticed = follow_up_answers.get("q6_first_appeared", "1-2 days ago")
    spread_status = follow_up_answers.get("q7_spreading", "Slow / Localized")
    weather_moisture = follow_up_answers.get("q8_weather_watering", "Normal / Moderate")

    # 2. Build customized "What to check now"
    check_now = list(ref.get("what_to_check_now", []))
    
    # Contextual enhancements
    if "Fruiting" in stage or "Maturity" in stage:
        check_now.append(f"Inspect developing fruits/produce for spots, rot, or sun-scald caused by canopy loss.")
    elif "Seedling" in stage:
        check_now.append(f"Seedlings are sensitive; check collar region near soil line for damping-off or stem constriction.")

    if companion_crops and companion_crops != "None / Single Crop" and companion_crops != "No":
        check_now.append(f"Check companion crops ({companion_crops}) to ensure disease is not cross-infecting other species.")

    if "Heavy" in weeds or "Moderate" in weeds:
        check_now.append("Inspect surrounding weeds as they often harbor fungal spores and insect vectors.")

    # 3. Build customized "What to monitor"
    monitor_steps = list(ref.get("what_to_monitor", []))
    
    if "Heavy rain" in weather_moisture or "Overhead" in weather_moisture:
        monitor_steps.append("High moisture accelerates fungal sporulation. Inspect leaves again 24 hours after rain or watering.")
    
    if "Rapid" in spread_status:
        monitor_steps.insert(0, "URGENT SPREAD ALERT: Scout the field daily in the morning to track rapid outward movement.")

    # 4. Build customized "When to seek help"
    seek_help = list(ref.get("when_to_seek_help", []))
    
    if "> 50%" in affected_pct or "20-50%" in affected_pct:
        seek_help.insert(0, f"High urgency: With {affected_pct} of the field showing symptoms, contact your local Krishi Vigyan Kendra (KVK) or extension officer immediately for on-site inspection.")

    # 5. Build dynamic action timeline & checklist
    base_timeline = list(ref.get("timeline_actions", []))
    timeline_items = []
    
    for item in base_timeline:
        timeline_items.append({
            "id": f"task_{len(timeline_items) + 1}",
            "period": item.get("period", "Today"),
            "task": item.get("task", ""),
            "completed": False
        })

    # Add custom timeline items based on answers
    if "Heavy" in weeds:
        timeline_items.append({
            "id": f"task_{len(timeline_items) + 1}",
            "period": "Today",
            "task": "Hand-weed the immediate 1-meter radius around affected plants to improve bottom airflow.",
            "completed": False
        })

    if "Overhead" in weather_moisture:
        timeline_items.append({
            "id": f"task_{len(timeline_items) + 1}",
            "period": "Next 2-3 Days",
            "task": "Switch from overhead splashing to furrow or basin irrigation at soil level.",
            "completed": False
        })

    return {
        "crop": crop_selected,
        "condition": ref.get("condition", "Observed Condition"),
        "scientific_name": ref.get("scientific_name", ""),
        "category": ref.get("category", "General"),
        "plain_summary": ref.get("plain_summary", ""),
        "visible_symptoms": ref.get("visible_symptoms", []),
        "what_to_check_now": check_now,
        "what_to_monitor": monitor_steps,
        "when_to_seek_help": seek_help,
        "timeline_actions": timeline_items,
        "safety_note": ref.get("safety_note", "Always consult a certified local agronomist before purchasing or applying any chemical spray."),
        "summary_bullets": [
            f"Crop & Stage: {crop_selected} ({stage})",
            f"Field Affected: {affected_pct}",
            f"Spread Trend: {spread_status}",
            f"Moisture Context: {weather_moisture}"
        ]
    }
