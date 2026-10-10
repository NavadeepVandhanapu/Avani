"""
Avani Action-Support Guidance Engine
Generates tailored inspection plans and timelines from model predictions,
questionnaire answers, and curated agricultural references.
Fully supports English (en), Telugu (te), and Hindi (hi).
"""

from typing import Dict, Any, List
from guidance_data import GUIDANCE_DATABASE, GENERIC_CROP_GUIDANCE
from guidance_translations import (
    get_localized_crop,
    get_localized_condition,
    get_localized_category,
    get_localized_guidance_entry,
    PERIODS_LOCALIZED,
    QUESTIONNAIRE_VALUES_LOCALIZED,
    CROPS_LOCALIZED
)

def generate_action_plan(
    predicted_class: str,
    confidence: float,
    is_healthy: bool,
    follow_up_answers: Dict[str, Any],
    language: str = "en"
) -> Dict[str, Any]:
    """
    Synthesizes model diagnosis and 8-question farmer response into a practical,
    fully localized action plan in English, Telugu, or Hindi.
    Strictly differentiates confirmed high-confidence diagnoses from uncertain observations.
    """
    if language not in ["en", "te", "hi"]:
        language = "en"

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
        matched_key = target_class
        raw_ref = GUIDANCE_DATABASE[target_class]
    else:
        crop_prefix = target_class.split("___")[0]
        matching_key = next((k for k in GUIDANCE_DATABASE.keys() if k.startswith(crop_prefix)), None)
        if matching_key:
            matched_key = matching_key
            raw_ref = GUIDANCE_DATABASE[matching_key]
        else:
            matched_key = "GENERIC_CROP_GUIDANCE"
            raw_ref = GENERIC_CROP_GUIDANCE

    # Localize base reference content
    ref = get_localized_guidance_entry(matched_key, raw_ref, language=language)

    # Extract follow-up context
    raw_crop = farmer_crop or raw_ref.get("crop", "General Crop")
    crop_selected = get_localized_crop(raw_crop, language=language)
    stage = follow_up_answers.get("q2_age", "Vegetative / Growth")
    affected_pct = follow_up_answers.get("q3_field_affected", "< 5% (Isolated plants)")
    companion_crops = follow_up_answers.get("q4_companion_crops", "None / Single Crop")
    weeds = follow_up_answers.get("q5_weeds", "Low / Clean field")
    first_noticed = follow_up_answers.get("q6_first_appeared", "1-2 days ago")
    spread_status = follow_up_answers.get("q7_spreading", "Spreading slowly")
    weather_moisture = follow_up_answers.get("q8_weather_watering", "Normal drip / furrow")

    # Localized versions of questionnaire attributes
    loc_stage = QUESTIONNAIRE_VALUES_LOCALIZED.get(stage, {}).get(language, stage)
    loc_affected_pct = QUESTIONNAIRE_VALUES_LOCALIZED.get(affected_pct, {}).get(language, affected_pct)
    loc_spread = QUESTIONNAIRE_VALUES_LOCALIZED.get(spread_status, {}).get(language, spread_status)
    loc_moisture = QUESTIONNAIRE_VALUES_LOCALIZED.get(weather_moisture, {}).get(language, weather_moisture)
    loc_companion = get_localized_crop(companion_crops, language) if companion_crops not in ["None / Single Crop", "No", "None"] else companion_crops

    # 2. Build customized "What to check now"
    check_now = list(ref.get("what_to_check_now", []))
    
    # Adapt to healthy state
    if is_healthy and not is_uncertain_diagnosis:
        if language == "te":
            check_now = [
                "దాగి ఉన్న పురుగులు లేదా నల్లులు లేవని నిర్ధారించుకోవడానికి 5 వేర్వేరు చోట్ల ఆకుల అడుగు భాగాన్ని పరిశీలించండి.",
                "వేర్ల వద్ద నీరు నిల్వ లేకుండా సమానమైన నేల తేమను నిర్వహించండి.",
                "తెగుళ్ళను నియంత్రించే సహజ మిత్ర పురుగులను (లేడీబగ్స్ వంటివి) సంరక్షించండి."
            ]
        elif language == "hi":
            check_now = [
                "छिपे हुए कीटों या माइट्स की जांच के लिए 5 स्थानों पर पत्तियों की निचली सतह का निरीक्षण करें।",
                "जड़ों में जलभराव के बिना एक समान मिट्टी की नमी बनाए रखें।",
                "हानिकारक कीटों को नियंत्रित करने वाले मित्र कीटों (जैसे लेडीबग) का संरक्षण करें।"
            ]
        else:
            check_now = [
                "Inspect underside of random leaves across 5 locations to confirm zero hidden mites or aphids.",
                "Verify uniform soil moisture without root-zone waterlogging.",
                "Preserve beneficial predators (ladybugs, lacewings, predatory mites) currently keeping pests in check."
            ]
    elif is_uncertain_diagnosis:
        if language == "te":
            check_now = [
                f"⚠️ దృశ్య నమూనా ఇంకా నిర్ధారించబడలేదు ({int(confidence*100)}% సరిపోలిక). మొదట సూచన మార్గదర్శకంతో క్షేత్ర లక్షణాలను సరిపోల్చండి.",
                "మచ్చలకు వలయాలు ఉన్నాయా (ఫంగస్) లేదా తడి అంచులు ఉన్నాయా (బ్యాక్టీరియా) అని గమనించండి.",
                "ఆకుల పై మరియు కింది భాగాలలో బూజు లేదా తెల్లటి పొడి ఉందో లేదో చూడండి."
            ]
        elif language == "hi":
            check_now = [
                f"⚠️ दृश्य पैटर्न अभी असत्यापित है ({int(confidence*100)}% मिलान)। पहले संदर्भ गाइड से लक्षणों का मिलान करें।",
                "जांचें कि क्या धब्बों पर छल्ले हैं (फंगल) या पानी जैसे किनारे हैं (जीवाणु)।",
                "पत्तियों की ऊपरी व निचली सतह पर फफूंद या सफेद पाउडर की जांच करें।"
            ]
        else:
            check_now = [
                f"⚠️ Visual pattern is unconfirmed ({int(confidence*100)}% match). First verify physical symptoms against reference guide.",
                "Inspect whether spots have concentric target rings (fungal) or angular water-soaked margins (bacterial).",
                "Check both upper and lower leaf surfaces for velvety fungal spores or powdery white growth."
            ]

    # Contextual enhancements in the target language
    if "Fruiting" in stage or "Maturity" in stage:
        if language == "te":
            check_now.append("ఎదుగుతున్న కాయలు/పండ్లపై మచ్చలు, కుళ్ళు లేదా ఆకులు రాలడం వల్ల కలిగే ఎండ దెబ్బలను తనిఖీ చేయండి.")
        elif language == "hi":
            check_now.append("विकसित हो रहे फलों/उपज पर धब्बे, सड़न या पत्तियां गिरने से धूप के नुकसान की जांच करें।")
        else:
            check_now.append("Inspect developing fruits/tubers/ears for lesion spread, rot spots, or sun-scald.")
    elif "Seedling" in stage:
        if language == "te":
            check_now.append("లేత మొలకలు సున్నితంగా ఉంటాయి; నేల దగ్గర కాండం కుళ్ళిపోవడం లేదా ముడుచుకుపోవడం ఉందో లేదో చూడండి.")
        elif language == "hi":
            check_now.append("छोटे पौधे नाजुक होते हैं; जमीन के पास तने के हिस्से में गलन या सिकुड़न की जांच करें।")
        else:
            check_now.append("Seedlings have tender stems; inspect the collar region near soil line for damping-off constriction.")

    if companion_crops and companion_crops not in ["None / Single Crop", "No", "None"]:
        if language == "te":
            check_now.append(f"పక్కనున్న అంతర పంటలకు ({loc_companion}) తెగులు వ్యాపించకుండా ఉండటానికి వాటి ఆకులను కూడా పరిశీలించండి.")
        elif language == "hi":
            check_now.append(f"साथ लगी सह-फसलों ({loc_companion}) की जांच करें ताकि रोग अन्य प्रजातियों में न फैले।")
        else:
            check_now.append(f"Scout companion crop rows ({companion_crops}) to ensure pathogens are not cross-jumping species.")

    # Contextual enhancements based on weeds
    if "Heavy" in weeds or "Moderate" in weeds:
        if language == "te":
            check_now.append("చుట్టూ ఉన్న కలుపు మొక్కలను తనిఖీ చేయండి; వాటిపై ఫంగస్ బీజాలు మరియు పురుగులు ఆశ్రయం పొందుతాయి.")
        elif language == "hi":
            check_now.append("आसपास के खरपतवारों की जांच करें क्योंकि वे अक्सर फफूंद बीजाणुओं और कीटों को पनाह देते हैं।")
        else:
            check_now.append("Inspect nearby weeds as they frequently host alternate fungal spores and vector insects (aphids/whiteflies).")

    # 3. Build customized "What to monitor"
    monitor_steps = list(ref.get("what_to_monitor", []))

    if is_healthy and not is_uncertain_diagnosis:
        if language == "te":
            monitor_steps = [
                "వారపు సాధారణ తనిఖీలను కొనసాగించండి; కొత్తగా పసుపు రంగు మారడం లేదా మచ్చలు వస్తున్నాయా అని గమనించండి.",
                "వాతావరణ సూచనలను గమనిస్తూ ఉండండి, అధిక తేమ సమయాల్లో జాగ్రత్త వహించండి."
            ]
        elif language == "hi":
            monitor_steps = [
                "नियमित साप्ताहिक निरीक्षण जारी रखें; किसी भी नए पीलेपन या धब्बे पर ध्यान दें।",
                "मौसम पूर्वानुमान पर नज़र रखें, अधिक नमी की स्थिति में सतर्क रहें।"
            ]
        else:
            monitor_steps = [
                "Perform weekly routine scouting; note any new yellowing or chlorotic halos.",
                "Monitor weather forecasts for sudden high humidity periods (>75%) that favor spore germination."
            ]

    if "Heavy rain" in weather_moisture or "Overhead" in weather_moisture or "rain" in weather_moisture.lower() or "fog" in weather_moisture.lower():
        if language == "te":
            monitor_steps.append("అధిక తేమ వల్ల ఫంగస్ వేగంగా వృద్ధి చెందుతుంది. వర్షం లేదా నీరు పెట్టిన 24 గంటల తర్వాత ఆకులను మళ్లీ పరిశీలించండి.")
        elif language == "hi":
            monitor_steps.append("अत्यधिक नमी फफूंद के प्रसार को बढ़ाती है। बारिश या सिंचाई के 24 घंटे बाद पत्तियों का पुनः निरीक्षण करें।")
        else:
            monitor_steps.append("High moisture accelerates fungal sporulation. Inspect leaves again 24 hours after rain or watering.")
    
    if "Rapid" in spread_status or "rapid" in spread_status.lower() or "fast" in spread_status.lower():
        if language == "te":
            monitor_steps.insert(0, "అత్యవసర వ్యాప్తి హెచ్చరిక: తెగులు వేగంగా పాకుతున్నందున రోజూ ఉదయం పొలమంతా తిరుగుతూ గమనించండి.")
        elif language == "hi":
            monitor_steps.insert(0, "त्वरित प्रसार चेतावनी: तेजी से बढ़ते फैलाव को देखने के लिए प्रतिदिन सुबह खेत का निरीक्षण करें।")
        else:
            monitor_steps.insert(0, "RAPID SPREAD ALERT: Scout the field daily in the morning to track rapid outward movement.")

    # 4. Build customized "When to seek help"
    seek_help = list(ref.get("when_to_seek_help", []))

    if "> 50%" in affected_pct or "20-50%" in affected_pct:
        if language == "te":
            seek_help.insert(0, f"అత్యవసర పరిస్థితి: పొలంలో {loc_affected_pct} భాగం లక్షణాలు చూపిస్తున్నందున, తక్షణమే మీ స్థానిక కృషి విజ్ఞాన కేంద్రం (KVK) లేదా వ్యవసాయ అధికారిని సంప్రదించండి.")
        elif language == "hi":
            seek_help.insert(0, f"अत्यधिक प्राथमिकता: खेत के {loc_affected_pct} हिस्से में लक्षण दिखने पर तुरंत अपने स्थानीय कृषि विज्ञान केंद्र (KVK) अथवा कृषि अधिकारी से संपर्क करें।")
        else:
            seek_help.insert(0, f"High urgency: With {affected_pct} of the field showing symptoms, contact your nearest Krishi Vigyan Kendra (KVK) or Mandal Agricultural Officer immediately.")
    
    if is_uncertain_diagnosis:
        if language == "te":
            seek_help.append("ఈ ఫోటో తక్కువ నిశ్చయతను కలిగి ఉన్నందున, భౌతిక నిర్ధారణ కోసం 2-3 రోగలక్షణ ఆకులను ప్లాస్టిక్ సంచిలో స్థానిక వ్యవసాయ అధికారి వద్దకు తీసుకెళ్ళండి.")
        elif language == "hi":
            seek_help.append("चूंकि इस फोटो में दृश्य विश्वास कम है, भौतिक पुष्टि के लिए 2-3 प्रभावित पत्तियों को स्थानीय कृषि अधिकारी के पास ले जाएं।")
        else:
            seek_help.append("Because this photo had low visual confidence, bring 2-3 symptomatic leaves in a sealed plastic bag to a local extension officer for physical verification.")

    # 5. Build dynamic action timeline & checklist
    base_timeline = list(ref.get("timeline_actions", []))
    timeline_items = []

    for item in base_timeline:
        period_val = item.get("period", "Today")
        period_loc = PERIODS_LOCALIZED.get(period_val, {}).get(language, period_val)
        timeline_items.append({
            "id": f"task_{len(timeline_items) + 1}",
            "period": period_loc,
            "task": item.get("task", ""),
            "completed": False
        })

    # Add custom timeline items based on answers
    today_loc = PERIODS_LOCALIZED.get("Today", {}).get(language, "Today")
    days_loc = PERIODS_LOCALIZED.get("Next 2-3 Days", {}).get(language, "Next 2-3 Days")

    if "Heavy" in weeds:
        if language == "te":
            task_desc = "మొక్కల మొదళ్ల వద్ద గాలి ప్రసరణ బాగుండేందుకు చుట్టూ 1 మీటర్ పరిధిలో ఉన్న కలుపు మొక్కలను చేత్తో తీసివేయండి."
        elif language == "hi":
            task_desc = "पौधों के निचले हिस्से में हवा का संचार बेहतर करने के लिए प्रभावित पौधों के 1 मीटर दायरे में निराई-गुड़ाई करें।"
        else:
            task_desc = "Hand-weed immediate 1-meter radius around symptomatic plants to increase aeration and drop humidity."
        timeline_items.append({
            "id": f"task_{len(timeline_items) + 1}",
            "period": today_loc,
            "task": task_desc,
            "completed": False
        })

    if "Overhead" in weather_moisture or "rain" in weather_moisture.lower():
        if language == "te":
            task_desc = "పైనుంచి నీళ్లు చల్లడం ఆపి, భూమి మట్టంలో డ్రిప్ లేదా కాల్వల ద్వారా మాత్రమే నీరు అందించండి."
        elif language == "hi":
            task_desc = "ऊपर से पानी छिड़कने के बजाय जमीन की सतह पर क्यारियों या ड्रिप विधि से सिंचाई करें।"
        else:
            task_desc = "Switch from overhead splashing to furrow or basin irrigation at soil level."
        timeline_items.append({
            "id": f"task_{len(timeline_items) + 1}",
            "period": days_loc,
            "task": task_desc,
            "completed": False
        })

    condition_display = ref.get("condition", "Observed Condition")
    if is_uncertain_diagnosis:
        if language == "te":
            condition_display = f"ధృవీకరించబడని పరిశీలన ({condition_display} పోలి ఉంది)"
        elif language == "hi":
            condition_display = f"अपुष्ट अवलोकन ({condition_display} से मिलता-जुलता)"
        else:
            condition_display = f"Unconfirmed Observation (Resembles {condition_display})"

    # Localized Summary Bullets
    if language == "te":
        summary_bullets = [
            f"పంట & దశ: {crop_selected} ({loc_stage})",
            f"ప్రభావిత విస్తీర్ణం: {loc_affected_pct}",
            f"లక్షణాల వ్యవధి: {first_noticed}",
            f"వ్యాప్తి ధోరణి: {loc_spread}",
            f"తేమ పరిస్థితి: {loc_moisture}"
        ]
    elif language == "hi":
        summary_bullets = [
            f"फसल व अवस्था: {crop_selected} ({loc_stage})",
            f"प्रभावित क्षेत्र: {loc_affected_pct}",
            f"लक्षणों की अवधि: {first_noticed}",
            f"प्रसार की स्थिति: {loc_spread}",
            f"नमी की स्थिति: {loc_moisture}"
        ]
    else:
        summary_bullets = [
            f"Crop & Stage: {crop_selected} ({stage})",
            f"Field Affected: {affected_pct}",
            f"Symptom Duration: {first_noticed}",
            f"Spread Trend: {spread_status}",
            f"Moisture Context: {weather_moisture}"
        ]

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
        "summary_bullets": summary_bullets
    }
