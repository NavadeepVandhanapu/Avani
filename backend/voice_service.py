"""
Avani Voice Query & Contextual Guidance Service
Processes farmer spoken questions in English, Telugu, and Hindi,
matching verified ICAR agronomic guidance and scan context.
Distinguishes advice questions from acknowledgements, corrections,
unrelated messages, and requests for clarification.
Guarantees pure, single-language output without mixed-language fragments.
"""

from typing import Dict, Any, Optional, List
import logging
import re

from guidance_data import GUIDANCE_DATABASE, GENERIC_CROP_GUIDANCE
from guidance_translations import (
    get_localized_crop,
    get_localized_condition,
    get_localized_guidance_entry,
    FALLBACK_MESSAGES
)

logger = logging.getLogger("avani.voice")


def _detect_language(text: str, fallback: str = "en") -> str:
    """
    Detects input language from Unicode script characters.
    Telugu: U+0C00–U+0C7F
    Devanagari (Hindi): U+0900–U+097F
    Returns 'te', 'hi', or the fallback (default 'en').
    """
    telugu_count = sum(1 for ch in text if '\u0C00' <= ch <= '\u0C7F')
    hindi_count = sum(1 for ch in text if '\u0900' <= ch <= '\u097F')

    if telugu_count >= 3:
        return "te"
    if hindi_count >= 3:
        return "hi"
    return fallback


CROP_KEYWORDS: Dict[str, List[str]] = {
    "Tomato": ["tomato", "టమోటా", "టమాటా", "टमाटर"],
    "Potato": ["potato", "బంగాళాదుంప", "ఆలూ", "ఆలు", "आलू"],
    "Corn (Maize)": ["corn", "maize", "మొక్కజొన్న", "మక్క", "జొన్న", "मक्का", "भुट्टा"],
    "Apple": ["apple", "యాపిల్", "ఆపిల్", "सेब"],
    "Grape": ["grape", "ద్రాక్ష", "అంగూర్", "अंगूर"],
    "Pepper (Capsicum)": ["chili", "pepper", "capsicum", "మిరప", "కాప్సికం", "మిర్చి", "मिर्च", "शिमला मिर्च"],
    "Rice (Paddy)": ["rice", "paddy", "వరి", "వరిపంట", "వరిచేను", "ధాన్యం", "धान", "चावल"]
}

# Acknowledgement / "I know that" / Gratitude keywords
ACKNOWLEDGEMENT_PATTERNS = [
    # Telugu
    "అది నాకు తెలుసు", "నాకు తెలుసు", "ఇది నాకు తెలుసు", "నాకు తెలుసండి", "తెలుసు",
    "సరే", "సరేనండి", "అర్థమైంది", "అర్థమయింది", "ధన్యవాదాలు", "థాంక్స్", "చాలు", "సరే సరే",
    # Hindi
    "मुझे पता है", "यह मुझे पता है", "मुझे मालूम है", "यह मुझे मालूम है", "पता है", "मालूम है",
    "ठीक है", "समझ गया", "समझ गई", "धन्यवाद", "शुक्रिया", "थैंक्स", "बस",
    # English
    "i already know that", "i know that", "i already know", "i know this", "i know", "already know",
    "got it", "understood", "okay", "ok", "alright", "thank you", "thanks", "i see"
]

PREVENTION_PATTERNS = [
    # Telugu: "దీనిని ఎలా అరికట్టాలి?", "నివారణ", "నియంత్రణ"
    "అరికట్టాలి", "అరికట్టడం", "నివారణ", "నివారించాలి", "నివారించడం", "నియంత్రణ", "నియంత్రించాలి",
    "ఆపాలి", "ఆపడం", "తగ్గించాలి", "కాపాడాలి", "రక్షించాలి", "ఎలా అరికట్టాలి", "ఎలా నివారించాలి",
    # Hindi: "रोकथाम", "कैसे रोकें", "बचाव"
    "रोकथाम", "रोकें", "रोकना", "कैसे रोकें", "नियंत्रण", "बचाव", "बचाएं", "उपचार", "इलाज", "समाधान", "रोकने",
    # English
    "how to prevent", "prevention", "prevent", "how to control", "control", "how to manage",
    "manage", "management", "how to stop", "stop this", "how to treat", "remedy", "protect"
]

WATER_PATTERNS = [
    # Telugu: "నీరు", "నీటి", "పారుదల", "ఎప్పుడు పెట్టాలి"
    "నీరు", "నీటి", "పారుదల", "తడి", "నీళ్ళు", "ఎప్పుడు పెట్టాలి", "ఎప్పుడు పోయాలి", "తడులు",
    # Hindi: "सिंचाई", "पानी कब दें"
    "सिंचाई", "पानी कब दें", "पानी कब लगाएं", "पानी", "जल",
    # English
    "when to water", "watering", "how often to water", "water", "irrigation"
]

SPRAY_PATTERNS = [
    # Telugu: "మందు", "స్ప్రే", "పిచికారీ", "పురుగుల"
    "మందు", "స్ప్రే", "పిచికారీ", "పురుగుల", "దవా", "రసాయనం",
    # Hindi: "दवा", "छिड़काव", "कीटनाशक"
    "दवा", "छिड़काव", "कीटनाशक", "दवाई", "स्प्रे",
    # English
    "spray", "spraying", "chemical", "pesticide", "fungicide", "medicine"
]

SPOTS_PATTERNS = [
    # Telugu: "మచ్చలు", "తెగులు", "మచ్చ", "మాడు", "లక్షణాలు", "రంగు"
    "మచ్చలు", "తెగులు", "మచ్చ", "మాడు", "లక్షణాలు", "రంగు మారడం", "పసుపు", "పాలిపోవడం",
    # Hindi
    "धब्बे", "झुलसा", "दाग", "लक्षण", "पीला", "पीलापन",
    # English
    "spot", "spots", "lesion", "blight", "symptom", "symptoms", "markings", "yellowing", "yellow"
]

RUST_PATTERNS = [
    # Telugu
    "తుప్పు", "రస్ట్", "పౌడర్", "బూజు", "గేరువా",
    # Hindi
    "गेरुआ", "रतुआ", "चूर्ण", "फफूंद",
    # English
    "rust", "pustule", "powder", "mildew"
]

WEATHER_PATTERNS = [
    # Telugu
    "వాతావరణం", "వర్షం", "మంచు", "తేమ", "ఎండ",
    # Hindi
    "मौसम", "बारिश", "कोहरा", "नमी",
    # English
    "weather", "rain", "fog", "humidity"
]

EXPERT_PATTERNS = [
    # Telugu
    "అధికారి", "శాస్త్రవేత్త", "కేంద్రం", "కృషి", "విజ్ఞాన", "సహాయం", "డాక్టర్",
    # Hindi
    "विशेषज्ञ", "अधिकारी", "कृषि विज्ञान", "केवीके",
    # English
    "expert", "officer", "doctor", "kvk", "extension"
]

GENERAL_ACTION_PATTERNS = [
    # Telugu: "ఏమి చేయాలి", "ఏం చేయాలి", "తక్షణమే", "పరిశీలన"
    "ఏమి చేయాలి", "ఏం చేయాలి", "తక్షణమే", "ఇప్పుడు ఏం చేయాలి",
    # Hindi
    "क्या करें", "तुरंत क्या करें", "अब क्या करें",
    # English
    "what should i do", "what to do", "immediately", "immediate action", "next steps"
]

QUESTION_WORDS = [
    "ఎలా", "ఎప్పుడు", "ఏమి", "ఏం", "ఎందుకు",
    "कैसे", "कब", "क्या", "क्यों",
    "how", "when", "what", "why", "which"
]


def _classify_intent(query: str) -> str:
    """
    Classifies farmer input into a precise agronomic or conversational intent.
    Distinguishes advice questions from acknowledgements, corrections,
    and unsupported inputs without assuming keyword presence implies advice.
    """
    q_clean = query.lower().strip()
    q_no_punct = re.sub(r'[?.!,;:\'\"।]', '', q_clean).strip()

    # 1. Acknowledgement / Gratitude / "I know that"
    # An acknowledgement may not contain actionable question words
    has_question_word = any(qw in q_clean for qw in QUESTION_WORDS)
    has_action_demand = any(pat in q_clean for pat in PREVENTION_PATTERNS + WATER_PATTERNS + SPRAY_PATTERNS)

    if not has_action_demand:
        for ack in ACKNOWLEDGEMENT_PATTERNS:
            if ack in q_clean or q_no_punct == ack:
                return "acknowledgement"

    # 2. Prevention & Control ("దీనిని ఎలా అరికట్టాలి?")
    if any(pat in q_clean for pat in PREVENTION_PATTERNS):
        return "prevention"

    # 3. Water & Irrigation ("నీరు ఎప్పుడు పెట్టాలి?")
    if any(pat in q_clean for pat in WATER_PATTERNS):
        return "water"

    # 4. Spray & Chemical treatments
    if any(pat in q_clean for pat in SPRAY_PATTERNS):
        return "spray"

    # 5. Expert & KVK guidance
    if any(pat in q_clean for pat in EXPERT_PATTERNS):
        return "expert"

    # 6. Weather & Climate factors
    if any(pat in q_clean for pat in WEATHER_PATTERNS):
        return "weather"

    # 7. Rust & Powdery mildews
    if any(pat in q_clean for pat in RUST_PATTERNS):
        return "rust"

    # 8. Leaf Spots & Visible symptoms
    if any(pat in q_clean for pat in SPOTS_PATTERNS):
        return "spots"

    # 9. General action request ("What should I do immediately?")
    if any(pat in q_clean for pat in GENERAL_ACTION_PATTERNS):
        return "general_action"

    # 10. Check if query asks generally about a specific recognized crop
    for crop_name, keywords in CROP_KEYWORDS.items():
        if any(kw in q_clean for kw in keywords):
            return "general_action"

    return "unsupported"


def process_voice_query(
    query: str,
    language: str = "en",
    scan_context: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    Answers farmer spoken questions using verified crop guidance and relevant scan context.
    - Accurately identifies conversational intent (acknowledgement vs. advice vs. unsupported).
    - Uses scan context ONLY when relevant to the actual question.
    - Never dumps generic disease guidance as the answer to every query.
    - Localizes 100% of the farmer-facing response without mixed-language artifacts.
    """
    # Auto-detect language from query text
    detected_lang = _detect_language(query, language)
    if detected_lang not in ["en", "te", "hi"]:
        detected_lang = "en"
    language = detected_lang

    q_lower = query.lower()

    # 1. Classify intent
    intent = _classify_intent(query)

    # 2. Identify crop focus
    matched_crop_key = None
    for crop_name, keywords in CROP_KEYWORDS.items():
        if any(kw in q_lower for kw in keywords):
            matched_crop_key = crop_name
            break

    # If query did not specify crop, borrow from scan_context only if relevant
    has_valid_scan_crop = bool(
        scan_context and scan_context.get("crop") and
        scan_context.get("crop") not in ["General Crop", "Unconfirmed Crop", "గుర్తించబడని పంట", "अज्ञात फसल"]
    )
    if not matched_crop_key and has_valid_scan_crop and intent not in ["acknowledgement", "unsupported"]:
        matched_crop_key = scan_context.get("crop")

    # Localized crop display label
    if matched_crop_key:
        crop_display = get_localized_crop(matched_crop_key, language=language)
    else:
        crop_display = get_localized_crop("Unconfirmed Crop", language=language)

    # 3. Identify relevant guidance reference (applied only when query relates to crop/condition)
    active_ref_key = "GENERIC_CROP_GUIDANCE"
    raw_ref = None

    if intent in ["prevention", "spots", "rust", "general_action"]:
        if scan_context and scan_context.get("predicted_class") in GUIDANCE_DATABASE:
            active_ref_key = scan_context["predicted_class"]
            raw_ref = GUIDANCE_DATABASE[scan_context["predicted_class"]]
        elif matched_crop_key:
            for k, v in GUIDANCE_DATABASE.items():
                if v.get("crop", "").lower() == matched_crop_key.lower():
                    active_ref_key = k
                    raw_ref = v
                    break

    if not raw_ref:
        active_ref_key = "GENERIC_CROP_GUIDANCE"
        raw_ref = GENERIC_CROP_GUIDANCE

    active_ref = get_localized_guidance_entry(active_ref_key, raw_ref, language=language)
    condition_display = active_ref.get("condition", get_localized_condition("Foliage Inspection", language))

    # 4. Generate response tailored strictly to intent
    frontend_matched_crop: Optional[str] = crop_display
    is_scan_context_applied = False
    action_pointers: List[str] = []

    if intent == "acknowledgement":
        # Farmer acknowledges previous message: "అది నాకు తెలుసు", "సరే", "ధన్యవాదాలు"
        # Never repeat scan disease guidance or diagnostic action pointers!
        frontend_matched_crop = None
        condition_display = None
        action_pointers = []
        is_scan_context_applied = False

        if language == "te":
            answer = "సరే, మీకు ఆ విషయం ఇప్పటికే తెలుసని అర్థమైంది. మరేదైనా తెలుసుకోవాలనుకుంటున్నారా? (ఉదాహరణకు: నివారణ చర్యలు లేదా నీటి యాజమాన్యం)."
        elif language == "hi":
            answer = "ठीक है, समझ गया कि आपको यह पहले से पता है। क्या आप कुछ और जानना चाहते हैं? (जैसे: रोकथाम के उपाय या सिंचाई प्रबंधन)।"
        else:
            answer = "Understood, you are already aware of this. Is there anything else you would like to know? (for example: prevention steps or watering management)."

    elif intent == "unsupported":
        # Unclear, gibberish, or unsupported query
        # Ask localized clarification instead of regurgitating active scan guidance
        frontend_matched_crop = None
        condition_display = None
        action_pointers = []
        is_scan_context_applied = False

        if language == "te":
            answer = "మీ ప్రశ్న స్పష్టంగా అర్థం కాలేదు. దయచేసి పంట తెగులు లక్షణాలు, నివారణ చర్యలు, నీటి యాజమాన్యం లేదా పురుగుమందుల వాడకం గురించి అడగండి."
        elif language == "hi":
            answer = "आपका सवाल स्पष्ट रूप से समझ नहीं आया। कृपया फसल के रोग लक्षण, रोकथाम के उपाय, सिंचाई प्रबंधन या दवा के छिड़काव के बारे में पूछें।"
        else:
            answer = "I could not clearly understand your question. Please ask about crop symptoms, prevention steps, watering management, or recommended field practices."

    elif intent == "prevention":
        # Question asking how to prevent/control/stop disease ("దీనిని ఎలా అరికట్టాలి?")
        is_scan_context_applied = bool(scan_context and scan_context.get("predicted_class") in GUIDANCE_DATABASE)

        if is_scan_context_applied:
            if language == "te":
                answer = f"{crop_display} లో {condition_display} నివారణకు ముఖ్య చర్యలు: వ్యాధి సోకిన కింది ఆకులను వెంటనే తొలగించి నాశనం చేయండి, తేమ నిలవకుండా డ్రైనేజీ కాల్వలను సరిచేయండి మరియు మొక్కల మధ్య తగినంత గాలి ప్రసరణ ఉండేలా చూడండి. తెగులు ఉధృతి పెరిగితే స్థానిక వ్యవసాయ అధికారి లేదా కేవీకే సిఫార్సు చేసిన నివారణ చర్యలు పాటించండి."
            elif language == "hi":
                answer = f"{crop_display} में {condition_display} की रोकथाम के लिए मुख्य उपाय: प्रभावित निचली पत्तियों को तुरंत हटाकर नष्ट करें, खेत में जलभराव न होने दें और उचित वायु संचार बनाए रखें। प्रकोप अधिक होने पर कृषि विशेषज्ञ (KVK) की सलाह से ही उपचार करें।"
            else:
                answer = f"For prevention and control of {condition_display} in {crop_display}: Promptly remove heavily diseased lower leaves away from the field, ensure proper row aeration and drainage to reduce humidity, and consult local extension officers before spraying."

            if language == "te":
                action_pointers = [
                    "వ్యాధి సోకిన కింది ఆకులను జాగ్రత్తగా తుంచి పొలానికి దూరంగా పారవేయండి.",
                    "ఆకులపై తేమ ఎక్కువసేపు ఉండకుండా ఉదయం వేళల్లో మాత్రమే మొదళ్ళ వద్ద నీరు పెట్టండి.",
                    "పొలంలో 10% కంటే ఎక్కువ మొక్కలకు వ్యాపిస్తే స్థానిక కేవీకే లేదా వ్యవసాయ అధికారిని సంప్రదించండి."
                ]
            elif language == "hi":
                action_pointers = [
                    "संक्रमित निचली पत्तियों को सावधानीपूर्वक तोड़कर खेत से दूर नष्ट करें।",
                    "पत्तियों पर नमी कम रखने के लिए सुबह के समय ही सिंचाई करें।",
                    "यदि 10% से अधिक पौधे प्रभावित हों तो नजदीकी KVK या कृषि अधिकारी से परामर्श लें।"
                ]
            else:
                action_pointers = [
                    "Carefully remove and discard severely spotted lower leaves away from the field.",
                    "Water at the plant base early in the day so leaf canopy dries quickly.",
                    "Consult your local KVK or agricultural officer if disease spreads across more than 10% of plants."
                ]
        else:
            if language == "te":
                answer = f"{crop_display} పంటలో తెగుళ్ళను అరికట్టడానికి ప్రాథమిక చర్యలు: వ్యాధి సోకిన ఆకులను ఏరివేసి పొలానికి దూరంగా నాశనం చేయండి, మొక్కల మొదళ్ళ వద్ద నీరు నిల్వ ఉండకుండా చూడండి, మరియు నేల తేమను బట్టి పారుదల చేయండి."
            elif language == "hi":
                answer = f"{crop_display} में बीमारियों की रोकथाम के लिए मुख्य उपाय: प्रभावित पत्तियों को तोड़कर खेत से दूर नष्ट करें, जड़ों के पास जलभराव न होने दें और संतुलित पोषण का ध्यान रखें।"
            else:
                answer = f"Key prevention steps for {crop_display}: Promptly remove and safely destroy diseased foliage away from the field, avoid excess moisture around the root zone, and ensure good field sanitation."

            action_pointers = active_ref.get("what_to_check_now", [])[:3]

    elif intent == "water":
        # Question regarding watering / irrigation
        is_scan_context_applied = bool(scan_context and scan_context.get("crop"))
        if language == "te":
            answer = f"{crop_display} పంటకు నేల పైపొర 2-3 అంగుళాల లోతు ఆరిన తర్వాత మాత్రమే తేలికపాటి తడి ఇవ్వండి. ఆకులపై నీరు పడకుండా డ్రిప్ లేదా మొదళ్ళ వద్ద పారుదల చేయడం వల్ల ఫంగస్ మరియు తెగుళ్ళ వ్యాప్తిని అరికట్టవచ్చు."
            action_pointers = [
                "నేల తేమ శాతాన్ని వేర్ల వద్ద తనిఖీ చేసి మాత్రమే నీరు పెట్టండి.",
                "మధ్యాహ్నపు ఎండలో కాకుండా ఉదయం పూట మాత్రమే పారుదల చేయండి.",
                "పొలంలో నీరు నిల్వ ఉండకుండా మురుగు కాలువలను సరిచేయండి."
            ]
        elif language == "hi":
            answer = f"{crop_display} की फसल में मिट्टी की ऊपरी 2-3 इंच सतह सूखने पर ही हल्की सिंचाई करें। पत्तियों को गीला करने से बचें और ड्रिप या थाला विधि अपनाएं, क्योंकि अधिक नमी से रोग तेजी से फैलते हैं।"
            action_pointers = [
                "जड़ क्षेत्र में मिट्टी की नमी जांचने के बाद ही पानी दें।",
                "दोपहर की तेज धूप के बजाय सुबह के समय ही सिंचाई करें।",
                "खेत में पानी भरने से रोकने के लिए जलनिकासी नाली साफ रखें।"
            ]
        else:
            answer = f"For {crop_display}, irrigate only when top 2-3 inches of root zone soil feel dry. Use drip or furrow irrigation to keep leaf foliage dry, as lingering moisture encourages fungal growth."
            action_pointers = [
                "Check root-zone soil moisture before scheduling irrigation.",
                "Water early in the morning rather than midday to minimize foliage dampness.",
                "Ensure drainage furrows allow excess rainwater or irrigation to drain freely."
            ]

    elif intent == "spray":
        # Question regarding sprays, chemicals, or pesticides
        is_scan_context_applied = bool(scan_context and scan_context.get("crop"))
        if language == "te":
            answer = "సరైన రోగనిర్ధారణ లేకుండా రసాయన మందులు పిచికారీ చేయకండి. మొదట తెగులు సోకిన ఆకులను ఏరివేసి నాశనం చేయండి. అవసరమైతే మీ సమీప కృషి విజ్ఞాన కేంద్రం (KVK) లేదా వ్యవసాయ అధికారి సిఫార్సు చేసిన మందులను మాత్రమే సరైన మోతాదులో వాడండి."
            action_pointers = [
                "సిఫార్సు చేయని మందులను పిచికారీ చేయవద్దు.",
                "మందులు వాడేటప్పుడు రక్షణ దుస్తులు మరియు మాస్క్ ధరించండి.",
                "స్థానిక వ్యవసాయ అధికారి లేదా కేవీకే సలహా తీసుకోండి."
            ]
        elif language == "hi":
            answer = "सटीक पहचान के बिना कीटनाशकों का अंधाधुंध छिड़काव न करें। पहले प्रभावित पत्तियों को अलग करें और स्थानीय कृषि विज्ञान केंद्र (KVK) की सिफारिश अनुसार ही अनुमोदित दवा का प्रयोग करें।"
            action_pointers = [
                "अपुष्ट कीटनाशकों का प्रयोग न करें।",
                "दवा छिड़कते समय सुरक्षा मास्क और दस्ताने पहनें।",
                "स्थानीय कृषि विस्तार अधिकारी से परामर्श लें।"
            ]
        else:
            answer = "Do not apply chemical sprays without confirmed field diagnosis. First remove severely infected leaves and consult your local KVK or agricultural extension officer for approved regional recommendations."
            action_pointers = [
                "Do not spray unauthorized chemical mixtures.",
                "Wear protective mask and gloves when handling agrochemicals.",
                "Consult your block agricultural extension officer or KVK."
            ]

    elif intent in ["rust", "spots"]:
        # Question regarding visible spots or rust
        is_scan_context_applied = bool(scan_context and scan_context.get("crop"))
        symptoms_list = [s.rstrip('. ।') for s in active_ref.get("visible_symptoms", [])]
        symptoms_text = ", ".join(symptoms_list[:2]) if symptoms_list else FALLBACK_MESSAGES.get(language, "")
        if language == "te":
            answer = f"{crop_display} పై ముఖ్య లక్షణాలు: {symptoms_text}. తెగులు కింది ఆకుల నుంచి పైకి పాకుతుందో లేదో రోజూ తనిఖీ చేయండి."
        elif language == "hi":
            answer = f"{crop_display} में मुख्य लक्षण: {symptoms_text}। ध्यान दें कि क्या लक्षण निचली पत्तियों से ऊपर की ओर फैल रहे हैं।"
        else:
            answer = f"For {crop_display} ({condition_display}), key visible signs include: {symptoms_text}. Inspect daily to see if spots progress upward toward upper canopy leaves."
        action_pointers = active_ref.get("what_to_check_now", [])[:3]

    elif intent == "weather":
        # Question regarding weather influences
        is_scan_context_applied = False
        if language == "te":
            answer = "చల్లని, తేమతో కూడిన లేదా పొగమంచు వాతావరణంలో ఫంగస్ వేగంగా వ్యాపిస్తుంది. వర్షం తర్వాత 24 గంటల్లో పొలాన్ని క్షుణ్ణంగా పరిశీలించండి మరియు మురుగు నీరు నిలవకుండా చూడండి."
            action_pointers = [
                "వర్షం తర్వాత పొలంలో నీటి నిల్వ లేకుండా చూసుకోండి.",
                "తేమ ఎక్కువగా ఉన్న సమయాల్లో ఆకుల అడుగు భాగాలను తనిఖీ చేయండి.",
                "వ్యాధి తీవ్రత పెరిగితే పొలాన్ని పరిశుభ్రంగా ఉంచండి."
            ]
        elif language == "hi":
            answer = "अधिक नमी, बारिश या कोहरे के मौसम में फफूंद जनित रोग तेजी से फैलते हैं। बारिश के बाद खेत में जलनिकासी सुनिश्चित करें और पत्तियों की जांच करें।"
            action_pointers = [
                "बारिश के बाद खेत में पानी का भराव न होने दें।",
                "अधिक नमी वाले दिनों में पत्तियों की निचली सतह की जांच करें।",
                "खेत की मेड़ों को साफ रखें।"
            ]
        else:
            answer = "High humidity, prolonged morning dew, and overcast rain accelerate fungal spread. Ensure field furrows drain freely and inspect foliage 24 hours after rainfall."
            action_pointers = [
                "Ensure furrows drain immediately after heavy rainfall.",
                "Check leaf undersides during extended foggy mornings.",
                "Maintain weed-free field borders to discourage fungal buildup."
            ]

    elif intent == "expert":
        # Question asking about contacting extension / KVK
        is_scan_context_applied = False
        if language == "te":
            answer = "పొలంలో 10% కంటే ఎక్కువ పంటకు తెగులు వ్యాపించినప్పుడు లేదా ప్రధాన ఆకులు ఎండిపోతున్నప్పుడు వెంటనే మీ సమీప రైతు సేవా కేంద్రం లేదా కృషి విజ్ఞాన కేంద్రం (KVK) ను సంప్రదించండి."
            action_pointers = [
                "బాధిత మొక్క ఆకు నమూనాను సేకరించి దగ్గరి కేవీకేకు తీసుకెళ్ళండి.",
                "విత్తనం రకం మరియు నాటిన తేదీ వివరాలను సిద్ధంగా ఉంచుకోండి.",
                "స్థానిక వ్యవసాయ విస్తరణ అధికారి సూచనలను పాటించండి."
            ]
        elif language == "hi":
            answer = "यदि 10% से अधिक फसल प्रभावित हो या मुख्य पत्तियां सूखने लगें, तो तुरंत अपने नजदीकी कृषि विस्तार अधिकारी या कृषि विज्ञान केंद्र (KVK) से संपर्क करें।"
            action_pointers = [
                "प्रभावित पत्तियों का नमूना लेकर नजदीकी KVK जाएं।",
                "बीज की किस्म और बुवाई की तारीख की जानकारी साथ रखें।",
                "कृषि अधिकारी के दिशा-निर्देशों का पालन करें।"
            ]
        else:
            answer = "Contact your local Krishi Vigyan Kendra (KVK) or block agricultural extension officer immediately if more than 10% of the field shows rapid symptom spread."
            action_pointers = [
                "Take a representative leaf sample to the nearest KVK.",
                "Keep planting date and hybrid seed details ready.",
                "Follow recommendations provided by authorized extension staff."
            ]

    else:
        # General action / crop overview when explicitly asked
        is_scan_context_applied = bool(scan_context and (scan_context.get("crop") or scan_context.get("predicted_class")))
        summary = active_ref.get("plain_summary") or FALLBACK_MESSAGES.get(language, "Follow standard field scouting practices.")
        check_steps = active_ref.get("what_to_check_now", [])
        first_step = check_steps[0] if check_steps else FALLBACK_MESSAGES.get(language, "Inspect upper and lower leaf surfaces.")
        if language == "te":
            answer = f"{crop_display} ({condition_display}) పరిశీలన: {summary} తక్షణమే చేయాల్సిన పని: {first_step}."
        elif language == "hi":
            answer = f"{crop_display} ({condition_display}) जानकारी: {summary} अभी यह करें: {first_step}."
        else:
            answer = f"Observation for {crop_display} ({condition_display}): {summary} Immediate action to take: {first_step}"
        action_pointers = active_ref.get("what_to_check_now", [])[:3]

    logger.info(
        "[VoiceQuery] query='%s' lang='%s' intent='%s' matched_crop='%s' active_ref='%s' scan_applied=%s",
        query, language, intent, frontend_matched_crop, active_ref_key, is_scan_context_applied
    )

    return {
        "success": True,
        "query": query,
        "language": language,
        "matched_crop": frontend_matched_crop,
        "condition": condition_display,
        "answer_text": answer,
        "action_pointers": action_pointers,
        "is_scan_context_applied": is_scan_context_applied
    }

