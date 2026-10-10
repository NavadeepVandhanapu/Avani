import React from 'react';
import { 
  Camera, 
  History, 
  CloudSun, 
  Volume2, 
  Bell, 
  ArrowRight, 
  Layers, 
  Mic, 
  Calendar,
  Sparkles,
  Play,
  Check
} from 'lucide-react';
import type { Language, WeatherData, SavedScan } from '../types';
import { SpeechAssistant } from '../utils/speech';
import { REALTIME_NOTIFICATIONS } from './NotificationsModal';

interface HomePageProps {
  currentLang: Language;
  onLanguageChange: (lang: Language) => void;
  onStartScan: () => void;
  onStartCameraScan?: () => void;
  onOpenHistory: () => void;
  onOpenWeather: () => void;
  onOpenNotifications: () => void;
  onScanSampleLeaf?: (sampleUrl: string) => void;
  scanCount: number;
  weatherData?: WeatherData | null;
  savedScans?: SavedScan[];
  onSelectSavedScan?: (scan: SavedScan) => void;
}

const REAL_DATASET_LEAVES = [
  {
    id: 'tomato_early',
    crop: { en: 'Tomato', te: 'టమోటా', hi: 'टमाटर' },
    condition: { en: 'Early Blight', te: 'ముందస్తు తెగులు', hi: 'अगेती झुलसा' },
    imgUrl: '/samples/tomato_early_blight.jpg',
    tag: '🍅 Solanum',
    severity: 'High Fungal Lesions',
    symptomDesc: 'Concentric brown rings with chlorotic yellow halo'
  },
  {
    id: 'tomato_healthy',
    crop: { en: 'Tomato', te: 'టమోటా', hi: 'टमाटर' },
    condition: { en: 'Healthy Leaf', te: 'ఆరోగ్యకరమైన ఆకు', hi: 'स्वस्थ पत्ती' },
    imgUrl: '/samples/tomato_healthy.jpg',
    tag: '🌿 Healthy',
    severity: 'Zero Symptoms',
    symptomDesc: 'Uniform vibrant green chlorophyll distribution'
  },
  {
    id: 'potato_late',
    crop: { en: 'Potato', te: 'బంగాళాదుంప', hi: 'आलू' },
    condition: { en: 'Late Blight', te: 'లేట్ బ్లైట్', hi: 'पछेती झुलसा' },
    imgUrl: '/samples/potato_late_blight.jpg',
    tag: '🥔 Solanum',
    severity: 'Water-Soaked Necrosis',
    symptomDesc: 'Irregular dark lesions with pale fungal margin'
  },
  {
    id: 'corn_rust',
    crop: { en: 'Corn (Maize)', te: 'మొక్కజొన్న', hi: 'मक्का' },
    condition: { en: 'Common Rust', te: 'తుప్పు తెగులు', hi: 'रतुआ' },
    imgUrl: '/samples/corn_common_rust.jpg',
    tag: '🌽 Poaceae',
    severity: 'Pustule Outbreak',
    symptomDesc: 'Reddish-brown elongated powdery pustules'
  },
  {
    id: 'pepper_bacterial',
    crop: { en: 'Chili / Pepper', te: 'మిరప', hi: 'मिर्च' },
    condition: { en: 'Bacterial Spot', te: 'బాక్టీరియల్ మచ్చలు', hi: 'जीवाणु धब्बा' },
    imgUrl: '/samples/pepper_bacterial_spot.jpg',
    tag: '🌶️ Capsicum',
    severity: 'Bacterial Oozing',
    symptomDesc: 'Small dark water-soaked spots with yellow margin'
  },
  {
    id: 'apple_scab',
    crop: { en: 'Apple', te: 'యాపిల్', hi: 'सेब' },
    condition: { en: 'Apple Scab', te: 'యాపిల్ స్కాబ్', hi: 'सेब स्कैब' },
    imgUrl: '/samples/apple_scab.jpg',
    tag: '🍏 Rosaceae',
    severity: 'Velvety Olive Spots',
    symptomDesc: 'Olive-green to black fungal crust on leaf surface'
  }
];

export const HomePage: React.FC<HomePageProps> = ({
  currentLang,
  onLanguageChange,
  onStartScan,
  onStartCameraScan,
  onOpenHistory,
  onOpenWeather,
  onOpenNotifications,
  onScanSampleLeaf,
  weatherData,
  savedScans = [],
  onSelectSavedScan
}) => {
  const topNotification = REALTIME_NOTIFICATIONS[0];

  const handleReadTopNotification = () => {
    const text = `${topNotification.title[currentLang]}. ${topNotification.message[currentLang]}`;
    SpeechAssistant.speak(text, currentLang);
  };

  const handleTeluguVoiceGuide = () => {
    onLanguageChange('te');
    const teluguSpeechText = "నమస్కారం! అవని స్మార్ట్ అగ్రికల్చర్ యాప్‌కు స్వాగతం. మీ పంట ఆకు ఫోటో తీసి స్కాన్ చేయండి లేదా నమూనా ఆకును ఎంచుకోండి. మేము వెంటనే తెగులును గుర్తించి, మీకు నివారణ ప్రణాళికను తెలుగులోనే తెలియజేస్తాము.";
    SpeechAssistant.speak(teluguSpeechText, 'te');
  };

  const labels = {
    en: {
      futureBadge: "The Future Of Smart Farming • FieldReady",
      heroHeadlineLine1: "Smart Farming for",
      heroHeadlineLine2: "Future Generations",
      heroSub: "Early crop disease detection and grounded action support built for speed, offline field resilience, and multi-language farmer guidance.",
      scanNowBtn: "Start Leaf Scan ↗",
      trySamplesBtn: "Test Dataset Leaves",
      voiceTeluguBtn: "🔊 తెలుగులో వినండి (Telugu Voice)",
      statAccuracy: "38 Plant Classes",
      statAccuracyDesc: "MobileNetV2 Taxonomic Classifier",
      howItWorksTitle: "How It Works",
      howItWorksSub: "Precision agricultural detection from a single leaf photo to a verified field recovery timeline.",
      step1Title: "1. Scan Leaf & HSV Segmentation",
      step1Desc: "MobileNetV2 CNN classifier extracts taxonomic disease patterns; HSV color-space highlights chlorosis and necrotic lesion hotspots.",
      step2Title: "2. Voice Context Follow-Up",
      step2Desc: "Answer 8 simple field questions via speech input in Telugu, Hindi, or English (crop stage, spread, weeds, watering).",
      step3Title: "3. Action TIMELINE & Real-Time Alerts",
      step3Desc: "Receive a grounded 3-part timeline (Today, Days 2-3, After 5 Days) + live agro-meteorological risk advisories.",
      realLeavesTitle: "Test Real Leaves from Dataset (PlantVillage Benchmark)",
      realLeavesSub: "Click any verified leaf below to immediately run CNN + HSV color-space segmentation and generate your action timeline.",
      scanThisLeaf: "Scan This Leaf ➔",
      forWhoTitle: "Built for Real-World Agricultural Impact",
      forSmallholdersTitle: "For Smallholders",
      forSmallholdersDesc: "Plain native language (Telugu/Hindi) audio guidance, PWA offline access, and strict safety guarantees against arbitrary chemicals.",
      forManagersTitle: "For Farm Managers",
      forManagersDesc: "Field-wide acreage spread assessments, companion crop pathogen risks, and agro-meteorological disease indexing.",
      forKvkTitle: "For KVK & Field Officers",
      forKvkDesc: "Factual escalation thresholds for agricultural science centers, verifiable symptom references, and adaptive model logging.",
      recentScansHeading: "Recent Field Scans",
      viewAll: "View All",
      innovathonTitle: "INNOVATHON 2026 — AgriTech: FieldReady",
      innovathonTeam: "Institute of Aeronautical Engineering (IARE)",
      teamMembers: "Team: B P S Kruthi (24951A05E9) • B Navya Sri (24951A05M7) • Navadeep Vandanapu (24951A05M4) • Nilesh Choudhary (24951A05N2)",
    },
    te: {
      futureBadge: "స్మార్ట్ వ్యవసాయ భవిష్యత్తు • ఫీల్డ్‌రెడీ",
      heroHeadlineLine1: "భవిష్యత్ తరాల కోసం",
      heroHeadlineLine2: "స్మార్ట్ వ్యవసాయం",
      heroSub: "కంప్యూటర్ విజన్, HSV కలర్ సెగ్మెంటేషన్ మరియు స్పష్టమైన కార్యాచరణ ప్రణాళికల ద్వారా పంటలకు తెగుళ్ళు వ్యాపించకముందే వాటిని గుర్తించండి.",
      scanNowBtn: "ఆకు స్కాన్ ప్రారంభించండి ↗",
      trySamplesBtn: "నమూనా ఆకులను చూడండి",
      voiceTeluguBtn: "🔊 తెలుగులో వినండి",
      statAccuracy: "38 రకాల పంట వ్యాధులు",
      statAccuracyDesc: "కంప్యూటర్ విజన్ వర్గీకరణ",
      howItWorksTitle: "ఇది ఎలా పనిచేస్తుంది",
      howItWorksSub: "ఒకే ఆకు ఫోటో నుండి స్పష్టమైన క్షేత్ర రక్షణ కాలక్రమం వరకు.",
      step1Title: "1. ఆకు స్కాన్ & HSV సెగ్మెంటేషన్",
      step1Desc: "కంప్యూటర్ విజన్ ద్వారా తెగులు గుర్తింపు; HSV కలర్ సెగ్మెంటేషన్ ద్వారా మచ్చలు మరియు పసుపు రంగు ప్రాంతాల విశ్లేషణ.",
      step2Title: "2. వాయిస్ సమాధానాలు",
      step2Desc: "తెలుగు, హిందీ లేదా ఇంగ్లీషులో మాట్లాడి 8 క్షేత్ర ప్రశ్నలకు సులభంగా సమాధానాలు చెప్పండి.",
      step3Title: "3. కార్యాచరణ కాలక్రమం & హెచ్చరికలు",
      step3Desc: "ఈరోజు, 2-3 రోజులు, 5 రోజుల తర్వాత చేయాల్సిన పనుల కాలక్రమం + ప్రత్యక్ష వాతావరణ హెచ్చరికలు.",
      realLeavesTitle: "నిజమైన ఆకుల నమూనాలు (PlantVillage డేటాసెట్)",
      realLeavesSub: "కింది నిజమైన ఆకులపై క్లిక్ చేసి వెంటనే AI పరీక్ష మరియు కార్యాచరణ ప్రణాళికను చూడండి.",
      scanThisLeaf: "ఈ ఆకును పరీక్షించండి ➔",
      forWhoTitle: "రైతుల వాస్తవ అవసరాల కోసం",
      forSmallholdersTitle: "చిన్న & సన్నకారు రైతులు",
      forSmallholdersDesc: "తెలుగులో స్పష్టమైన వాయిస్ సహాయం, ఇంటర్నెట్ లేకపోయినా పనిచేసే PWA సౌకర్యం.",
      forManagersTitle: "పొలం పర్యవేక్షకులు",
      forManagersDesc: "పొలమంతా వ్యాప్తి అంచనాలు మరియు వాతావరణ ఆధారిత ముప్పు సూచనలు.",
      forKvkTitle: "వ్యవసాయ అధికారులు (KVK)",
      forKvkDesc: "శాస్త్రీయ ప్రమాణాలు, వ్యాధి నిర్ధారణ చరిత్ర మరియు సురక్షిత రక్షణ మార్గదర్శకాలు.",
      recentScansHeading: "ఇటీవలి పంట తనిఖీలు",
      viewAll: "అన్నీ చూడండి",
      innovathonTitle: "ఇన్నోవాథాన్ 2026 — అగ్రిటెక్: ఫీల్డ్‌రెడీ",
      innovathonTeam: "ఇన్‌స్టిట్యూట్ ఆఫ్ ఏరోనాటికల్ ఇంజనీరింగ్ (IARE)",
      teamMembers: "బృందం: బి పి ఎస్ కృతి • బి నవ్య శ్రీ • నవదీప్ వందనపు • నీలేష్ చౌదరి",
    },
    hi: {
      futureBadge: "स्मार्ट खेती का भविष्य • फील्डरेडी",
      heroHeadlineLine1: "भावी पीढ़ियों के लिए",
      heroHeadlineLine2: "स्मार्ट खेती",
      heroSub: "कंप्यूटर विज़न, HSV रंग विभाजन और व्यावहारिक कार्ययोजना द्वारा फसल में बीमारी फैलने से पहले ही तुरंत सटीक कदम उठाएं।",
      scanNowBtn: "पत्ती स्कैन शुरू करें ↗",
      trySamplesBtn: "असली नमूने देखें",
      voiceTeluguBtn: "🔊 तेलुगु में सुनें",
      statAccuracy: "38 फसल व्याधियां",
      statAccuracyDesc: "सटीक पौध रोग वर्गीकरण",
      howItWorksTitle: "यह कैसे काम करता है",
      howItWorksSub: "एक पत्ती की तस्वीर से लेकर खेत सुधार की चरणबद्ध कार्ययोजना तक।",
      step1Title: "1. पत्ती स्कैन व HSV विभाजन",
      step1Desc: "मोबाइलनेट AI द्वारा रोग की पहचान; HSV रंग तकनीक द्वारा पत्तियों के धब्बों और क्षति की मैपिंग।",
      step2Title: "2. आवाज से उत्तर दें",
      step2Desc: "तेलुगु, हिन्दी या अंग्रेजी में बोलकर 8 आसान सवालों के जवाब दें (फसल अवस्था, फैलाव, सिंचाई)।",
      step3Title: "3. कार्ययोजना टाइमलाइन व अलर्ट",
      step3Desc: "आज, 2-3 दिन और 5 दिन बाद की समयबद्ध कार्ययोजना + मौसम की ताजा चेतावनी।",
      realLeavesTitle: "असली पत्ती नमूने (PlantVillage डेटाबेस)",
      realLeavesSub: "किसी भी पत्ती पर क्लिक करें और तुरंत AI जांच व कार्ययोजना शुरू करें।",
      scanThisLeaf: "यह पत्ती जांचें ➔",
      forWhoTitle: "कृषि क्षेत्र में वास्तविक बदलाव के लिए",
      forSmallholdersTitle: "छोटे और सीमांत किसान",
      forSmallholdersDesc: "हिन्दी में आवाज सहायता, बिना इंटरनेट चलने वाली PWA तकनीक और सुरक्षित सुझाव।",
      forManagersTitle: "खेत प्रबंधक",
      forManagersDesc: "पूरे खेत में रोग फैलाव का सटीक अनुमान और मौसम आधारित अलर्ट।",
      forKvkTitle: "कृषि विज्ञान केंद्र (KVK)",
      forKvkDesc: "वैज्ञानिक संदर्भ, बीमारी इतिहास और कृषि विशेषज्ञों से संपर्क सीमाएं।",
      recentScansHeading: "हाल की जांचें",
      viewAll: "सभी देखें",
      innovathonTitle: "इनोवाथॉन 2026 — एग्रीटेक: फील्डरेडी",
      innovathonTeam: "इंस्टीट्यूट ऑफ एयरोनॉटिकल इंजीनियरिंग (IARE)",
      teamMembers: "टीम: बी पी एस कृति • बी नव्या श्री • नवदीप वंदनपु • नीलेश चौधरी",
    }
  }[currentLang];

  return (
    <div className="space-y-12 pb-16 animate-fadeIn">
      
      {/* 1. Grand Agrovia-Style Scenic Hero Section (Exact Match to User Reference) */}
      <section className="relative rounded-3xl overflow-hidden shadow-2xl border border-white/20 mx-2 sm:mx-4 mt-2">
        
        {/* Full Cinematic Wheat Stalks Background (hero_agrovia.jpg) */}
        <div 
          className="absolute inset-0 bg-cover bg-center transition-transform duration-1000 scale-100"
          style={{ backgroundImage: `url('/hero_agrovia.jpg')` }}
        />
        
        {/* Subtle Vignette & Sunlight Gradient */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-black/20 sm:to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30" />

        {/* Hero Content Container */}
        <div className="relative z-10 max-w-6xl mx-auto px-5 sm:px-8 py-6 sm:py-10 text-white flex flex-col justify-between min-h-[640px]">
          
          {/* Top Floating Translucent Pill Navbar (Matching Agrovia Reference Exactly) */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-10">
            
            {/* Left: Brand Logo + Name */}
            <div className="flex items-center space-x-2.5">
              <div className="w-10 h-10 rounded-xl bg-white/90 p-1 backdrop-blur-md shadow-md flex items-center justify-center">
                <img src="/logo.png" alt="Avani Logo" className="w-full h-full object-contain rounded-lg" />
              </div>
              <span className="text-xl sm:text-2xl font-black tracking-tight text-white font-sans drop-shadow">
                Avani
              </span>
            </div>

            {/* Center: Frosted Glass Pill Capsule Navigation */}
            <nav className="hidden md:flex items-center space-x-1 bg-black/30 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/20 shadow-lg text-xs font-semibold text-white/90">
              <a 
                href="#top" 
                className="px-4 py-1.5 rounded-full bg-white text-gray-900 font-bold shadow-sm transition-all"
              >
                Home
              </a>
              <button 
                type="button"
                onClick={onStartScan}
                className="px-3.5 py-1.5 rounded-full hover:bg-white/15 text-white transition-all cursor-pointer"
              >
                Scan Leaf
              </button>
              <a 
                href="#real-leaf-samples" 
                className="px-3.5 py-1.5 rounded-full hover:bg-white/15 text-white transition-all"
              >
                Dataset Leaves
              </a>
              <a 
                href="#how-it-works" 
                className="px-3.5 py-1.5 rounded-full hover:bg-white/15 text-white transition-all"
              >
                Solutions
              </a>
              <button 
                type="button"
                onClick={onOpenNotifications}
                className="px-3.5 py-1.5 rounded-full hover:bg-white/15 text-white transition-all cursor-pointer"
              >
                Live Alerts
              </button>
              <a 
                href="#team-credits" 
                className="px-3.5 py-1.5 rounded-full hover:bg-white/15 text-white transition-all"
              >
                Team
              </a>
            </nav>

            {/* Right: Language Pills + Quick Scan CTA */}
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-1 bg-black/40 backdrop-blur-md px-2 py-1 rounded-full border border-white/20 text-xs">
                {(['en', 'te', 'hi'] as Language[]).map((lang) => (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => onLanguageChange(lang)}
                    className={`px-2.5 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                      currentLang === lang
                        ? 'bg-[#d4f04e] text-gray-950 shadow-sm'
                        : 'text-white/80 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    {lang === 'en' ? 'EN' : lang === 'te' ? 'తెలుగు' : 'हिन्दी'}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={onStartScan}
                className="hidden sm:flex px-4 py-2 rounded-full bg-white text-gray-950 font-bold text-xs hover:bg-white/90 shadow-md transition-all cursor-pointer items-center space-x-1"
              >
                <span>Scan</span>
                <span>↗</span>
              </button>
            </div>

          </div>

          {/* Main Hero Headline & Subtitle (Left Aligned like Reference) */}
          <div className="max-w-2xl my-auto py-6">
            
            {/* Pill Badge */}
            <div className="inline-flex items-center space-x-2 bg-black/35 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/25 text-xs font-semibold tracking-wide text-white mb-5 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-[#d4f04e] animate-pulse" />
              <span>{labels.futureBadge}</span>
            </div>

            {/* Agrovia Headline: "Smart Farming for Future Generations" */}
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white font-sans leading-[1.08] drop-shadow-lg">
              {labels.heroHeadlineLine1} <br />
              <span className="font-serif italic font-normal text-[#d4f04e] drop-shadow-md">
                {labels.heroHeadlineLine2}
              </span>
            </h1>

            {/* Clear Subtitle */}
            <p className="mt-5 text-sm sm:text-base lg:text-lg text-white/90 font-medium max-w-xl leading-relaxed drop-shadow">
              {labels.heroSub}
            </p>

            {/* Action Buttons: Glowing Lime Pill + Camera Scan + Translucent Frosted Pill + Telugu Voice */}
            <div className="mt-8 flex flex-wrap items-center gap-3.5">
              
              {/* Primary: Lime Green Pill Button */}
              <button
                onClick={onStartScan}
                id="hero-scan-leaf-btn"
                className="px-7 py-3.5 rounded-full bg-[#d4f04e] hover:bg-[#c2e23b] active:scale-95 text-gray-950 font-extrabold text-sm sm:text-base shadow-xl flex items-center space-x-2 transition-all cursor-pointer group"
              >
                <Camera className="w-5 h-5 text-gray-950 group-hover:scale-110 transition-transform" />
                <span>{labels.scanNowBtn}</span>
              </button>

              {/* Direct Live Camera Option for Real-Life Field Scan */}
              {onStartCameraScan && (
                <button
                  type="button"
                  onClick={onStartCameraScan}
                  className="px-6 py-3.5 rounded-full bg-emerald-600/90 hover:bg-emerald-500 text-cream font-bold text-sm sm:text-base backdrop-blur-md border border-emerald-400/60 transition-all cursor-pointer flex items-center space-x-2 shadow-lg hover:scale-105 active:scale-95"
                  title="Turn ON device camera directly to scan a living plant leaf in field"
                >
                  <Camera className="w-5 h-5 text-[#d4f04e]" />
                  <span>{currentLang === 'te' ? '📷 లైవ్ కెమెరా ఆన్' : currentLang === 'hi' ? '📷 लाइव कैमरा चालू' : '📷 Live Field Camera'}</span>
                </button>
              )}

              {/* Secondary: Translucent Frosted Pill Button */}
              <a
                href="#real-leaf-samples"
                className="px-6 py-3.5 rounded-full bg-black/35 hover:bg-black/50 text-white font-bold text-sm sm:text-base backdrop-blur-md border border-white/30 transition-all cursor-pointer flex items-center space-x-2 shadow-md"
              >
                <Layers className="w-4 h-4 text-[#d4f04e]" />
                <span>{labels.trySamplesBtn}</span>
              </a>

              {/* Voice in Telugu (Prominent Audio Assistance) */}
              <button
                type="button"
                onClick={handleTeluguVoiceGuide}
                className="px-5 py-3.5 rounded-full bg-emerald-950/70 hover:bg-emerald-900/80 text-white font-bold text-xs sm:text-sm backdrop-blur-md border border-emerald-400/50 shadow-lg transition-all cursor-pointer flex items-center space-x-2 group hover:scale-105"
                title="తెలుగులో సూచనలు వినండి (Listen in Telugu)"
              >
                <Volume2 className="w-4 h-4 text-[#d4f04e] group-hover:scale-110 animate-pulse" />
                <span>{labels.voiceTeluguBtn}</span>
              </button>

            </div>

          </div>

          {/* Bottom Bar: "SCROLL ↓" on Left, Rating + Social Proof on Right (Exact Agrovia Reference) */}
          <div className="mt-8 pt-4 border-t border-white/20 flex flex-wrap items-center justify-between gap-4">
            
            {/* Left: Scroll indicator */}
            <a 
              href="#real-leaf-samples"
              className="text-xs font-bold text-white/80 hover:text-white uppercase tracking-wider flex items-center space-x-1.5 transition-colors"
            >
              <span>SCROLL</span>
              <span className="animate-bounce font-extrabold">↓</span>
            </a>

            {/* Right: Social Proof & Agro Stats Badge */}
            <div className="flex flex-wrap items-center gap-3">
              
              {/* Farmer Avatars + 4.9 Rating */}
              <div className="flex items-center space-x-2.5 bg-black/40 backdrop-blur-md px-3.5 py-2 rounded-full border border-white/20">
                <div className="flex -space-x-1.5 overflow-hidden text-xs">
                  <span className="inline-block w-6 h-6 rounded-full bg-amber-400 text-center leading-6 text-[12px] shadow">👨‍🌾</span>
                  <span className="inline-block w-6 h-6 rounded-full bg-lime-400 text-center leading-6 text-[12px] shadow">👩‍🌾</span>
                  <span className="inline-block w-6 h-6 rounded-full bg-emerald-500 text-center leading-6 text-[12px] shadow">🧑‍🌾</span>
                </div>
                <div className="flex items-center space-x-1 text-xs font-bold text-white">
                  <span className="text-amber-400">★</span>
                  <span>4.9</span>
                  <span className="text-white/60 font-normal">| 10k+ Field Scans</span>
                </div>
              </div>

              {/* Weather Chip: Hyderabad, Telangana Focus */}
              <button
                onClick={onOpenWeather}
                className="flex items-center space-x-2 bg-black/40 backdrop-blur-md px-3.5 py-2 rounded-full border border-white/20 text-xs font-semibold text-white hover:bg-black/60 transition-colors cursor-pointer"
                title="View Hyderabad Agro-Weather & Disease Risks"
              >
                <CloudSun className="w-4 h-4 text-[#d4f04e]" />
                <span>
                  {weatherData ? weatherData.location : 'Hyderabad, Telangana'} • {weatherData ? weatherData.temperature : 28.5}°C ({weatherData ? weatherData.disease_risk.primary_level : 'Elevated'} Risk)
                </span>
              </button>

              {/* Alert Bell */}
              <button
                onClick={onOpenNotifications}
                className="flex items-center space-x-1.5 bg-[#d4f04e]/20 backdrop-blur-md px-3.5 py-2 rounded-full border border-[#d4f04e]/40 text-xs font-bold text-[#d4f04e] hover:bg-[#d4f04e]/30 transition-colors cursor-pointer"
              >
                <Bell className="w-3.5 h-3.5 animate-bounce" />
                <span>Live Alerts</span>
              </button>

            </div>

          </div>

        </div>

      </section>

      {/* 2. Real-Time Multilingual Alert Ticker Bar (Slide 3) */}
      <section className="max-w-5xl mx-auto px-4">
        <div className="bg-white border-2 border-ochre/40 rounded-2xl p-4 shadow-subtle flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center space-x-3 w-full sm:w-auto">
            <div className="w-10 h-10 rounded-xl bg-ochre/20 text-ochre flex items-center justify-center flex-shrink-0 animate-pulse">
              <Bell className="w-5 h-5 text-ochre" />
            </div>
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-extrabold uppercase tracking-wider bg-ochre/15 text-primary px-2.5 py-0.5 rounded-full">
                  Agro-Meteorological Alert
                </span>
                <span className="text-[11px] text-muted">
                  {topNotification.timestamp}
                </span>
              </div>
              <p className="text-xs sm:text-sm font-bold text-charcoal mt-1">
                {topNotification.message[currentLang]}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={handleReadTopNotification}
              className="p-2 rounded-lg bg-ivory hover:bg-warmborder text-primary border border-warmborder text-xs cursor-pointer flex items-center space-x-1"
              title="Listen aloud"
            >
              <Volume2 className="w-4 h-4" />
              <span className="text-[11px] font-semibold hidden sm:inline">Listen</span>
            </button>
            <button
              type="button"
              onClick={onOpenNotifications}
              className="px-3.5 py-2 rounded-lg bg-ochre text-white text-xs font-bold hover:bg-ochre-dark shadow-subtle cursor-pointer flex items-center space-x-1.5"
            >
              <span>View All Alerts</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </section>

      {/* 3. 1-Click Scan Real Leaf Dataset (PlantVillage 87K Benchmark) — With Actual Leaves! */}
      <section id="real-leaf-samples" className="max-w-5xl mx-auto px-4 scroll-mt-6">
        
        <div className="mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-2">
          <div>
            <div className="inline-flex items-center space-x-2 text-primary font-bold text-xs uppercase tracking-wider bg-secondary/15 px-3 py-1 rounded-full mb-2">
              <Sparkles className="w-3.5 h-3.5 text-ochre" />
              <span>PlantVillage 87K Dataset Benchmark</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-primary font-sans">
              {labels.realLeavesTitle}
            </h2>
            <p className="text-xs sm:text-sm text-muted mt-1 max-w-2xl">
              {labels.realLeavesSub}
            </p>
          </div>

          <button
            onClick={onStartScan}
            className="px-4 py-2 rounded-xl bg-primary text-cream hover:bg-primary-dark font-bold text-xs flex items-center space-x-2 shadow-subtle cursor-pointer self-start sm:self-auto"
          >
            <Camera className="w-4 h-4" />
            <span>Open Camera Scanner</span>
          </button>
        </div>

        {/* Real Leaves Interactive Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {REAL_DATASET_LEAVES.map((leaf) => (
            <div
              key={leaf.id}
              className="bg-white border border-warmborder hover:border-primary rounded-2xl p-4 shadow-subtle hover:shadow-card transition-all flex flex-col justify-between group"
            >
              <div>
                {/* Photo Thumbnail + Tag */}
                <div className="relative aspect-video rounded-xl overflow-hidden bg-ivory mb-3 border border-warmborder">
                  <img 
                    src={leaf.imgUrl} 
                    alt={leaf.condition.en} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                  />
                  <div className="absolute top-2 left-2 bg-charcoal/80 text-cream text-[10px] font-bold px-2 py-0.5 rounded-md backdrop-blur-sm">
                    {leaf.tag}
                  </div>
                  <div className="absolute bottom-2 right-2 bg-white/90 text-charcoal text-[10px] font-bold px-2 py-0.5 rounded-md backdrop-blur-sm border border-warmborder">
                    {leaf.severity}
                  </div>
                </div>

                {/* Leaf Title */}
                <h3 className="text-base font-bold text-primary font-sans flex items-center justify-between">
                  <span>{leaf.crop[currentLang]} — {leaf.condition[currentLang]}</span>
                </h3>
                <p className="text-xs text-muted mt-1 line-clamp-2">
                  {leaf.symptomDesc}
                </p>
              </div>

              {/* 1-Click Scan Button */}
              <div className="mt-4 pt-3 border-t border-warmborder/80 flex items-center justify-between">
                <span className="text-[11px] text-secondary-dark font-semibold">
                  Verified Sample
                </span>
                <button
                  type="button"
                  onClick={() => onScanSampleLeaf ? onScanSampleLeaf(leaf.imgUrl) : onStartScan()}
                  className="px-3.5 py-1.5 rounded-lg bg-primary hover:bg-primary-dark text-cream text-xs font-bold shadow-subtle flex items-center space-x-1.5 transition-all cursor-pointer group-hover:translate-x-0.5"
                >
                  <Play className="w-3 h-3 fill-current text-ochre" />
                  <span>{labels.scanThisLeaf}</span>
                </button>
              </div>

            </div>
          ))}
        </div>

      </section>

      {/* 4. "How It Works" (Matching the Right-Hand Flow from User's Reference Screenshot) */}
      <section id="how-it-works" className="max-w-5xl mx-auto px-4 scroll-mt-6">
        
        <div className="bg-cream border border-warmborder rounded-3xl p-6 sm:p-10 shadow-card">
          
          <div className="text-center sm:text-left mb-8">
            <span className="text-[11px] font-bold uppercase tracking-wider text-primary px-3 py-1 rounded-full bg-white border border-warmborder shadow-subtle">
              Architecture & Process
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-primary font-sans mt-2">
              {labels.howItWorksTitle}
            </h2>
            <p className="text-xs sm:text-sm text-muted mt-1 max-w-xl">
              {labels.howItWorksSub}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            {/* Left Side: Visual Leaf Inspection Preview (Matching Reference) */}
            <div className="lg:col-span-5 flex flex-col items-center">
              <div className="w-full max-w-sm rounded-2xl overflow-hidden bg-white border border-warmborder shadow-card p-3">
                <div className="aspect-square rounded-xl overflow-hidden relative border border-warmborder bg-ivory">
                  <img 
                    src="/samples/tomato_early_blight.jpg" 
                    alt="Tomato Early Blight Diagnosis" 
                    className="w-full h-full object-cover" 
                  />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-charcoal/90 via-charcoal/50 to-transparent p-4 text-cream">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider bg-ochre px-2 py-0.5 rounded text-white">
                      CNN + HSV Analyzed
                    </span>
                    <h4 className="text-sm font-bold mt-1">Tomato Early Blight (Alternaria solani)</h4>
                    <p className="text-[11px] text-cream/80">38.3% Lesion Surface • Severe Concentric Rings</p>
                  </div>
                </div>

                <div className="p-3 bg-ivory/60 rounded-xl mt-3 border border-warmborder text-xs flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-muted block font-medium">Model Match</span>
                    <span className="font-extrabold text-primary text-sm">99.2% Certainty</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted block font-medium">HSV Seg Ratio</span>
                    <span className="font-extrabold text-ochre text-sm">61.7% Healthy</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted block font-medium">Timeline</span>
                    <span className="font-extrabold text-secondary-dark text-sm">3-Part Action</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Side: Step Progression Flow (Matching the step cards from Reference Screenshot) */}
            <div className="lg:col-span-7 space-y-4">
              
              {/* Step 1 Card */}
              <div className="p-5 rounded-2xl bg-white border border-warmborder shadow-subtle hover:border-primary/40 transition-all flex items-start space-x-4">
                <div className="w-10 h-10 rounded-xl bg-primary text-cream flex items-center justify-center font-black text-sm flex-shrink-0 shadow-subtle">
                  <Layers className="w-5 h-5 text-cream" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-charcoal font-sans">
                    {labels.step1Title}
                  </h3>
                  <p className="text-xs text-muted mt-1 leading-relaxed">
                    {labels.step1Desc}
                  </p>
                </div>
              </div>

              {/* Step 2 Card */}
              <div className="p-5 rounded-2xl bg-white border border-warmborder shadow-subtle hover:border-secondary-dark transition-all flex items-start space-x-4">
                <div className="w-10 h-10 rounded-xl bg-secondary text-cream flex items-center justify-center font-black text-sm flex-shrink-0 shadow-subtle">
                  <Mic className="w-5 h-5 text-cream" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-charcoal font-sans">
                    {labels.step2Title}
                  </h3>
                  <p className="text-xs text-muted mt-1 leading-relaxed">
                    {labels.step2Desc}
                  </p>
                </div>
              </div>

              {/* Step 3 Card */}
              <div className="p-5 rounded-2xl bg-white border border-warmborder shadow-subtle hover:border-ochre transition-all flex items-start space-x-4">
                <div className="w-10 h-10 rounded-xl bg-ochre text-white flex items-center justify-center font-black text-sm flex-shrink-0 shadow-subtle">
                  <Calendar className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-charcoal font-sans">
                    {labels.step3Title}
                  </h3>
                  <p className="text-xs text-muted mt-1 leading-relaxed">
                    {labels.step3Desc}
                  </p>
                </div>
              </div>

            </div>

          </div>

        </div>

      </section>

      {/* 5. Audience Impact Section (Matching "For Smallholders • For Farm Managers • For Agribusiness" from Reference) */}
      <section className="max-w-5xl mx-auto px-4">
        <div className="text-center mb-6">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-primary font-sans">
            {labels.forWhoTitle}
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          <div className="p-6 rounded-2xl bg-white border border-warmborder shadow-subtle flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold mb-3">
                🌾
              </div>
              <h3 className="text-base font-bold text-charcoal font-sans">
                {labels.forSmallholdersTitle}
              </h3>
              <p className="text-xs text-muted mt-2 leading-relaxed">
                {labels.forSmallholdersDesc}
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-warmborder/60 text-[11px] font-bold text-primary flex items-center space-x-1">
              <Check className="w-3.5 h-3.5 text-secondary" />
              <span>Free & Accessible in Regional Languages</span>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-warmborder shadow-subtle flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-secondary/15 text-secondary-dark flex items-center justify-center font-bold mb-3">
                🚜
              </div>
              <h3 className="text-base font-bold text-charcoal font-sans">
                {labels.forManagersTitle}
              </h3>
              <p className="text-xs text-muted mt-2 leading-relaxed">
                {labels.forManagersDesc}
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-warmborder/60 text-[11px] font-bold text-secondary-dark flex items-center space-x-1">
              <Check className="w-3.5 h-3.5 text-secondary" />
              <span>Acreage Spread & Micro-Climate Alerts</span>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-warmborder shadow-subtle flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-ochre/15 text-ochre flex items-center justify-center font-bold mb-3">
                🏛️
              </div>
              <h3 className="text-base font-bold text-charcoal font-sans">
                {labels.forKvkTitle}
              </h3>
              <p className="text-xs text-muted mt-2 leading-relaxed">
                {labels.forKvkDesc}
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-warmborder/60 text-[11px] font-bold text-ochre flex items-center space-x-1">
              <Check className="w-3.5 h-3.5 text-ochre" />
              <span>Standard KVK Support Thresholds</span>
            </div>
          </div>

        </div>
      </section>

      {/* 6. Recent Scans (if any saved scans exist) */}
      {savedScans && savedScans.length > 0 && (
        <section className="max-w-5xl mx-auto px-4">
          <div className="bg-white border border-warmborder rounded-2xl p-6 shadow-subtle">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base sm:text-lg font-bold text-primary font-sans flex items-center space-x-2">
                <History className="w-4 h-4 text-primary" />
                <span>{labels.recentScansHeading}</span>
              </h3>
              <button
                onClick={onOpenHistory}
                className="text-xs text-secondary-dark font-bold hover:underline cursor-pointer"
              >
                {labels.viewAll} ({savedScans.length})
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {savedScans.slice(0, 2).map((scan) => (
                <div
                  key={scan.id}
                  onClick={() => onSelectSavedScan && onSelectSavedScan(scan)}
                  className="p-3.5 rounded-xl border border-warmborder bg-ivory/50 hover:bg-ivory transition-all cursor-pointer flex items-center justify-between"
                >
                  <div className="flex items-center space-x-3">
                    {scan.image_preview ? (
                      <img 
                        src={scan.image_preview} 
                        alt="Crop Preview" 
                        className="w-12 h-12 rounded-lg object-cover border border-warmborder" 
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                        🌿
                      </div>
                    )}
                    <div>
                      <h4 className="text-xs font-bold text-charcoal">
                        {scan.crop_name} — {scan.disease_name}
                      </h4>
                      <span className="text-[10px] text-muted">
                        {new Date(scan.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <span className="text-xs text-primary font-bold">➔</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 7. INNOVATHON 2026 Presentation Credits (Slide 1) */}
      <section id="team-credits" className="max-w-5xl mx-auto px-4 scroll-mt-6">
        <div className="p-6 sm:p-8 rounded-3xl bg-ivory border border-warmborder text-center shadow-subtle">
          <span className="text-[10px] font-bold uppercase tracking-widest text-primary bg-white border border-warmborder px-3.5 py-1 rounded-full shadow-subtle">
            Innovathon 2026 Official Project
          </span>
          <h3 className="text-lg sm:text-xl font-black text-primary font-sans mt-3">
            {labels.innovathonTitle}
          </h3>
          <p className="text-xs sm:text-sm text-charcoal font-bold mt-1">
            {labels.innovathonTeam}
          </p>
          <p className="text-xs text-muted mt-1.5 font-medium">
            {labels.teamMembers}
          </p>
        </div>
      </section>

    </div>
  );
};
