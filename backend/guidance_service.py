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
    Strictly differentiates confirmed high-confidence diagnoses from uncertain observations.
    """
    # 0. Check uncertainty and farmer crop selection
    is_uncertain_diagnosis = (confidence < 0.55) or (predicted_class == "Uncertain___Low_Confidence")
    farmer_crop = follow_up_answers.get("q1_crop")

    # 1. Retrieve base reference (prioritize farmer's selected crop if model was uncertain or mismatched)
    target_class = predicted_class
    if (is_uncertain_diagnosis or "General" in predicted_class) and farmer_crop:
        matching_key = next((k for k in GUIDANCE_DATABASE.keys() if farmer_crop.lower() in k.lower()), None)
        if matching_key:
            target_class = matching_key

    if target_class in GUIDANCE_DATABASE:
        ref = GUIDANCE_DATABASE[target_class]
    else:
        crop_prefix = target_class.split("___")[0]
        matching_key = next((k for k in GUIDANCE_DATABASE.keys() if k.startswith(crop_prefix)), None)
        ref = GUIDANCE_DATABASE[matching_key] if matching_key else GENERIC_CROP_GUIDANCE

    # Extract follow-up context
    crop_selected = farmer_crop or ref.get("crop", "Crop")
    stage = follow_up_answers.get("q2_age", "Vegetative Growth")
    affected_pct = follow_up_answers.get("q3_field_affected", "< 5% (Isolated plants)")
    companion_crops = follow_up_answers.get("q4_companion_crops", "None / Single Crop")
    weeds = follow_up_answers.get("q5_weeds", "Low / Clean field")
    first_noticed = follow_up_answers.get("q6_first_appeared", "1-2 days ago")
    spread_status = follow_up_answers.get("q7_spreading", "Spreading slowly")
    weather_moisture = follow_up_answers.get("q8_weather_watering", "Normal drip / furrow")

    # 2. Build customized "What to check now"
    check_now = list(ref.get("what_to_check_now", []))
    
    # Adapt to healthy state
    if is_healthy and not is_uncertain_diagnosis:
        check_now = [
            "Inspect underside of random leaves across 5 locations to confirm zero hidden mites or aphids.",
            "Verify uniform soil moisture without root-zone waterlogging.",
            "Preserve beneficial predators (ladybugs, lacewings, predatory mites) currently keeping pests in check."
        ]
    elif is_uncertain_diagnosis:
        check_now = [
            f"⚠️ Visual pattern is unconfirmed ({int(confidence*100)}% match). First verify physical symptoms against reference guide.",
            "Inspect whether spots have concentric target rings (fungal) or angular water-soaked margins (bacterial).",
            "Check both upper and lower leaf surfaces for velvety fungal spores or powdery white growth."
        ]
    
    # Contextual enhancements based on growth stage
    if "Fruiting" in stage or "Maturity" in stage:
        check_now.append("Inspect developing fruits/tubers/ears for lesion spread, rot spots, or sun-scald.")
    elif "Seedling" in stage:
        check_now.append("Seedlings have tender stems; inspect the collar region near soil line for damping-off constriction.")

    # Contextual enhancements based on companion crops
    if companion_crops and "None" not in companion_crops and "No" not in companion_crops:
        check_now.append(f"Scout companion crop rows ({companion_crops}) to ensure pathogens are not cross-jumping species.")

    # Contextual enhancements based on weeds
    if "Heavy" in weeds or "Moderate" in weeds:
        check_now.append("Inspect nearby weeds as they frequently host alternate fungal spores and vector insects (aphids/whiteflies).")

    # 3. Build customized "What to monitor"
    monitor_steps = list(ref.get("what_to_monitor", []))

    if is_healthy and not is_uncertain_diagnosis:
        monitor_steps = [
            "Perform weekly routine scouting; note any new yellowing or chlorotic halos.",
            "Monitor weather forecasts for sudden high humidity periods (>75%) that favor spore germination."
        ]
    
    # Symptom duration tailoring
    if "1-2 days" in first_noticed:
        monitor_steps.insert(0, "Early Detection Advantage: Track marked plants daily. Removing isolated first leaves now can prevent field-wide outbreak.")
    elif "1 week" in first_noticed or "2 weeks" in first_noticed:
        monitor_steps.insert(0, f"Symptom duration ({first_noticed}): Secondary infection cycles may have begun. Check a 3-row buffer perimeter around infected zones.")

    # Spread trend tailoring
    if "rapid" in spread_status.lower() or "fast" in spread_status.lower():
        monitor_steps.insert(0, "🚨 RAPID SPREAD ALERT: Mark affected perimeter with stakes; check movement daily every morning.")
    
    if "rain" in weather_moisture.lower() or "fog" in weather_moisture.lower():
        monitor_steps.append("Wet foliage accelerates spore germination. Re-inspect leaves within 24 hours after rain or heavy morning dew.")

    # 4. Build customized "When to seek help"
    seek_help = list(ref.get("when_to_seek_help", []))

    if "> 50%" in affected_pct or "20-50%" in affected_pct:
        seek_help.insert(0, f"High urgency: With {affected_pct} of the field showing symptoms, contact your nearest Krishi Vigyan Kendra (KVK) or Mandal Agricultural Officer immediately.")
    
    if is_uncertain_diagnosis:
        seek_help.append("Because this photo had low visual confidence, bring 2-3 symptomatic leaves in a sealed plastic bag to a local extension officer for physical verification.")

    # 5. Build dynamic action timeline & checklist
    timeline_items = []
    
    if is_healthy and not is_uncertain_diagnosis:
        timeline_items = [
            {"id": "task_1", "period": "Today", "task": "Maintain regular drip or furrow irrigation schedule without over-wetting root zone.", "completed": False},
            {"id": "task_2", "period": "Next 2-3 Days", "task": "Verify clean weeding along borders to eliminate potential vector hiding spots.", "completed": False},
            {"id": "task_3", "period": "After 5 Days", "task": "Routine re-inspection of 10 random leaf nodes across field.", "completed": False}
        ]
    else:
        base_timeline = list(ref.get("timeline_actions", []))
        for item in base_timeline:
            timeline_items.append({
                "id": f"task_{len(timeline_items) + 1}",
                "period": item.get("period", "Today"),
                "task": item.get("task", ""),
                "completed": False
            })

        # Add custom timeline items based on questionnaire answers
        if "< 5%" in affected_pct:
            timeline_items.insert(0, {
                "id": f"task_isolated_prune",
                "period": "Today",
                "task": "Hand-pluck isolated infected leaves into a bag; burn or bury them at least 50m away from the field.",
                "completed": False
            })

        if "Heavy" in weeds:
            timeline_items.append({
                "id": f"task_weed",
                "period": "Today",
                "task": "Hand-weed immediate 1-meter radius around symptomatic plants to increase aeration and drop humidity.",
                "completed": False
            })

        if "rain" in weather_moisture.lower() or "fog" in weather_moisture.lower():
            timeline_items.append({
                "id": f"task_drain",
                "period": "Today",
                "task": "Clear standing water furrows to prevent root hypoxia and water-borne spore transport.",
                "completed": False
            })

    condition_display = ref.get("condition", "Observed Condition")
    if is_uncertain_diagnosis:
        condition_display = f"Unconfirmed Observation (Resembles {condition_display})"

    return {
        "crop": crop_selected,
        "condition": condition_display,
        "is_uncertain_diagnosis": is_uncertain_diagnosis,
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
            f"Symptom Duration: {first_noticed}",
            f"Spread Trend: {spread_status}",
            f"Irrigation/Weather: {weather_moisture}"
        ]
    }
