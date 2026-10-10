import React, { useState, useEffect } from 'react';
import { 
  Eye, 
  ShieldCheck, 
  Bookmark, 
  RotateCcw, 
  Volume2, 
  VolumeX, 
  Square, 
  Building2, 
  Clock, 
  FileCheck2,
  Printer,
  Scissors,
  Droplets,
  Wind,
  Sparkles,
  Search,
  Zap,
  Camera,
  Lightbulb,
  CheckCircle2
} from 'lucide-react';
import type { Language, ActionPlanResponse, TimelineActionItem } from '../types';
import { TRANSLATIONS } from '../translations';
import { SpeechAssistant } from '../utils/speech';

interface ActionSupportPlanProps {
  currentLang: Language;
  plan: ActionPlanResponse;
  onSaveScan: () => void;
  isSaved: boolean;
  onScanAnother: () => void;
  onScanWithCamera?: () => void;
  weatherData?: any;
}

interface ActionMeta {
  category: string;
  icon: React.ReactNode;
  iconBg: string;
  badgeBg: string;
  periodLabel: string;
  periodBadge: string;
  explanation: string;
  fieldTip: string;
}

const getActionMeta = (taskText: string, period: string, lang: Language): ActionMeta => {
  const lower = taskText.toLowerCase();

  // Period label & color styling
  let periodLabel = period;
  let periodBadge = 'bg-primary/10 text-primary border-primary/20';
  if (period.toLowerCase().includes('today') || period.toLowerCase().includes('day 1')) {
    periodLabel = lang === 'te' ? '🌅 ఈరోజు (తక్షణం)' : lang === 'hi' ? '🌅 आज (तत्काल)' : '🌅 Day 1 • Today';
    periodBadge = 'bg-emerald-100 text-emerald-800 border-emerald-200';
  } else if (period.toLowerCase().includes('2') || period.toLowerCase().includes('3') || period.toLowerCase().includes('next')) {
    periodLabel = lang === 'te' ? '🗓️ 2-3 రోజుల్లో' : lang === 'hi' ? '🗓️ 2-3 दिनों में' : '🗓️ Days 2 to 3';
    periodBadge = 'bg-sky-100 text-sky-800 border-sky-200';
  } else if (period.toLowerCase().includes('5') || period.toLowerCase().includes('after')) {
    periodLabel = lang === 'te' ? '🔬 5 రోజుల తర్వాత' : lang === 'hi' ? '🔬 5 दिनों के बाद' : '🔬 Day 5+ • Follow-up';
    periodBadge = 'bg-amber-100 text-amber-800 border-amber-200';
  }

  // Sanitation / Pruning
  if (
    lower.includes('prune') || 
    lower.includes('pluck') || 
    lower.includes('burn') || 
    lower.includes('bury') || 
    lower.includes('bag') || 
    lower.includes('destroy') ||
    lower.includes('remove') ||
    lower.includes('isolated infected')
  ) {
    return {
      category: lang === 'te' ? 'ఆకుల పరిశుభ్రత & కత్తిరింపు' : lang === 'hi' ? 'संक्रमित पत्ती निष्कासन व स्वच्छता' : 'Sanitation & Physical Removal',
      icon: <Scissors className="w-5 h-5 text-rose-600" />,
      iconBg: 'bg-rose-50 border-rose-200 text-rose-700 shadow-rose-100',
      badgeBg: 'bg-rose-100 text-rose-800 border-rose-200',
      periodLabel,
      periodBadge,
      explanation: lang === 'te' 
        ? 'వ్యాధి సోకిన ఆకులను సంచిలో వేసి కాల్చడం లేదా పాతిపెట్టడం ద్వారా ఫంగస్ స్పోర్లు గాలి లేదా నీటి తుంపర్ల ద్వారా ఇతర మొక్కలకు వ్యాపించవు.' 
        : lang === 'hi' 
        ? 'संक्रमित पत्तियों को तोड़कर खेत से 50 मीटर दूर जलाने या दबाने से फफूंद के बीजाणु हवा और पानी के छींटों से बाकी पौधों में नहीं फैलते।' 
        : 'Plucking isolated infected leaves eliminates the primary spore source before wind or rain splash can spread inoculum across healthy rows.',
      fieldTip: lang === 'te' 
        ? 'కత్తిరించిన తర్వాత చేతులను లేదా కత్తెరను సబ్బు నీటితో శుభ్రం చేసుకోండి.' 
        : lang === 'hi' 
        ? 'संक्रमित पौधे छूने के बाद अपने हाथ व औजार साबुन या स्पिरिट से साफ करें।' 
        : 'Sterilize hands or shears with soap or 70% alcohol between handling plants.'
    };
  }

  // Water / Drainage / Moisture
  if (
    lower.includes('drain') || 
    lower.includes('water') || 
    lower.includes('irrigat') || 
    lower.includes('furrow') || 
    lower.includes('drip') || 
    lower.includes('moisture') ||
    lower.includes('standing water')
  ) {
    return {
      category: lang === 'te' ? 'నీటి పారుదల & మురుగునీటి నిర్వహణ' : lang === 'hi' ? 'सिंचाई व जल निकासी प्रबंधन' : 'Irrigation & Drainage Management',
      icon: <Droplets className="w-5 h-5 text-sky-600" />,
      iconBg: 'bg-sky-50 border-sky-200 text-sky-700 shadow-sky-100',
      badgeBg: 'bg-sky-100 text-sky-800 border-sky-200',
      periodLabel,
      periodBadge,
      explanation: lang === 'te' 
        ? 'ఆకులపై 6 గంటల కంటే ఎక్కువ నీరు నిలిచి ఉంటే ఫంగస్ బీజాలు వేగంగా మొలకెత్తుతాయి. మురుగు కాలువలను శుభ్రం చేసి నేలలో నీరు నిల్వ ఉండకుండా చూడండి.' 
        : lang === 'hi' 
        ? 'पत्तियों पर नमी बने रहने से रोगजनक फफूंद बहुत तेजी से पनपते हैं। क्यारियों में जलभराव रोकने से पौधों की जड़ें सुरक्षित रहती हैं।' 
        : 'Standing water and wet foliage create ideal spore germination conditions. Proper furrow drainage prevents root-zone hypoxia and fungal spread.',
      fieldTip: lang === 'te' 
        ? 'ఉదయమే నీరు పెట్టండి; సాయంత్రం లేదా రాత్రి ఆకులపై నీరు పడకుండా చూడండి.' 
        : lang === 'hi' 
        ? 'सिंचाई सुबह के समय करें ताकि दिन की धूप में पत्तियां जल्दी सूख जाएं।' 
        : 'Irrigate in early morning so sunlight and wind evaporate leaf moisture quickly.'
    };
  }

  // Weeding & Airflow
  if (
    lower.includes('weed') || 
    lower.includes('aerat') || 
    lower.includes('spacing') || 
    lower.includes('humidity') ||
    lower.includes('radius') ||
    lower.includes('border')
  ) {
    return {
      category: lang === 'te' ? 'కలుపు నివారణ & గాలి వెలుతురు' : lang === 'hi' ? 'निराई-गुड़ाई व वायु संचार' : 'Canopy Airflow & Weeding',
      icon: <Wind className="w-5 h-5 text-amber-600" />,
      iconBg: 'bg-amber-50 border-amber-200 text-amber-700 shadow-amber-100',
      badgeBg: 'bg-amber-100 text-amber-800 border-amber-200',
      periodLabel,
      periodBadge,
      explanation: lang === 'te' 
        ? 'కలుపు మొక్కలు తేమను పెంచుతాయి మరియు తెల్లదోమలు, పేనుబంక వంటి తెగుళ్ళకు ఆశ్రయం ఇస్తాయి. కలుపు తీయడం వల్ల మొక్కలకు మంచి గాలి వెలుతురు తగులుతాయి.' 
        : lang === 'hi' 
        ? 'घने खरपतवार हवा का बहाव रोककर नमी बढ़ाते हैं और रसचूसक कीटों के छिपने का घर बनते हैं। निराई से पौधों को धूप और ताजी हवा मिलती है।' 
        : 'Removing dense weeds drops relative humidity around the plant canopy and removes alternate hosts for sap-sucking disease vectors.',
      fieldTip: lang === 'te' 
        ? 'మొక్క చుట్టూ 1 మీటర్ పరిధిలో కలుపు లేకుండా శుభ్రంగా ఉంచండి.' 
        : lang === 'hi' 
        ? 'प्रभावित पौधे के 1 मीटर दायरे में खरपतवार पूरी तरह साफ रखें।' 
        : 'Clear weeds in a 1-meter radius around symptomatic plants to maximize airflow.'
    };
  }

  // Spray / Biocontrol / Neem / Protective Barrier
  if (
    lower.includes('spray') || 
    lower.includes('neem') || 
    lower.includes('bio') || 
    lower.includes('fungicid') || 
    lower.includes('trichoderma') ||
    lower.includes('protect') ||
    lower.includes('foliar')
  ) {
    return {
      category: lang === 'te' ? 'పర్యావరణ హిత రక్షణ స్ప్రే' : lang === 'hi' ? 'जैविक सुरक्षा छिड़काव' : 'Eco-Friendly Foliar Protection',
      icon: <Sparkles className="w-5 h-5 text-purple-600" />,
      iconBg: 'bg-purple-50 border-purple-200 text-purple-700 shadow-purple-100',
      badgeBg: 'bg-purple-100 text-purple-800 border-purple-200',
      periodLabel,
      periodBadge,
      explanation: lang === 'te' 
        ? 'వేప నూనె లేదా ఆమోదిత బయో-ఏజెంట్ ఆరోగ్యకరమైన ఆకులపై రక్షణ కవచంలా పనిచేసి కొత్త ఇన్ఫెక్షన్ రాకుండా అడ్డుకుంటుంది.' 
        : lang === 'hi' 
        ? 'नीम का अर्क या स्वीकृत जैव-फफूंदनाशी पत्तियों पर सुरक्षात्मक परत बनाकर नए संक्रमण को प्रवेश करने से रोकता है।' 
        : 'Organic botanical treatments coat healthy foliage with a protective film, inhibiting spore penetration into green leaf cells.',
      fieldTip: lang === 'te' 
        ? 'ఎండ తీవ్రత లేని ఉదయం 9 గంటల లోపు లేదా సాయంత్రం 5 గంటల తర్వాతే స్ప్రే చేయండి.' 
        : lang === 'hi' 
        ? 'छिड़काव हमेशा सुबह 9 बजे से पहले या शाम 5 बजे के बाद ही करें।' 
        : 'Apply sprays in cool early morning or late afternoon to prevent scorching.'
    };
  }

  // KVK / Extension / Agriculture Officer
  if (
    lower.includes('kvk') || 
    lower.includes('officer') || 
    lower.includes('mandal') || 
    lower.includes('extension') || 
    lower.includes('escalat') ||
    lower.includes('scientist') ||
    lower.includes('expert')
  ) {
    return {
      category: lang === 'te' ? 'వ్యవసాయ అధికారి (KVK) సంప్రదింపు' : lang === 'hi' ? 'कृषि विज्ञान केंद्र (KVK) विशेषज्ञ संपर्क' : 'Agricultural Extension (KVK)',
      icon: <Building2 className="w-5 h-5 text-indigo-600" />,
      iconBg: 'bg-indigo-50 border-indigo-200 text-indigo-700 shadow-indigo-100',
      badgeBg: 'bg-indigo-100 text-indigo-800 border-indigo-200',
      periodLabel,
      periodBadge,
      explanation: lang === 'te' 
        ? '5 రోజుల తర్వాత కూడా తెగులు లక్షణాలు తగ్గకపోతే లేదా ఇతర మొక్కలకు వ్యాపిస్తే, వ్యవసాయ అధికారుల సలహా తప్పనిసరి.' 
        : lang === 'hi' 
        ? 'यदि 5 दिनों के बाद भी लक्षण बढ़ते दिखें तो नजदीकी कृषि विज्ञान केंद्र से सही निदान व सिफारिश प्राप्त करें।' 
        : 'If symptoms persist or cross escalation thresholds, certified agronomists provide lab verification and targeted interventions.',
      fieldTip: lang === 'te' 
        ? 'తాజా ఆకులను పేపర్‌లో మడతపెట్టి అధికారుల వద్దకు తీసుకెళ్ళండి (ప్లాస్టిక్ కవర్‌లో పెట్టవద్దు).' 
        : lang === 'hi' 
        ? 'ताजी पत्तियों को अखबार में लपेटकर ले जाएं, गीली प्लास्टिक थैली में न रखें।' 
        : 'Carry 2-3 symptomatic leaves wrapped in newspaper rather than airtight plastic.'
    };
  }

  // Default: Field Scouting & Monitoring
  return {
    category: lang === 'te' ? 'క్షేత్ర తనిఖీ & పర్యవేక్షణ' : lang === 'hi' ? 'खेत निरीक्षण व सतत निगरानी' : 'Field Scouting & Monitoring',
    icon: <Search className="w-5 h-5 text-emerald-600" />,
    iconBg: 'bg-emerald-50 border-emerald-200 text-emerald-700 shadow-emerald-100',
    badgeBg: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    periodLabel,
    periodBadge,
    explanation: lang === 'te' 
      ? 'పొలంలో యాదృచ్ఛికంగా 10 మొక్కల ఆకుల అడుగు భాగాన్ని పరిశీలించి మచ్చల వ్యాప్తిని నమోదు చేయండి.' 
      : lang === 'hi' 
      ? 'खेत में 10 अलग-अलग पौधों की पत्तियों की निचली सतह की जांच कर नए धब्बों की निगरानी करें।' 
      : 'Scout 5-10 random plants across a zig-zag field path to track whether lesion borders are expanding or stabilizing.',
    fieldTip: lang === 'te' 
      ? 'ఆకుల కింద భాగాన్ని తిప్పి జాగ్రత్తగా పరిశీలించండి; ఫంగస్ లేదా పురుగులు అక్కడే దాగుంటాయి.' 
      : lang === 'hi' 
      ? 'पत्ती को पलटकर निचली सतह जरूर देखें जहां फफूंद व कीट पहले छिपते हैं।' 
      : 'Always inspect the undersides of leaves where early spore pustules first emerge.'
  };
};

export const ActionSupportPlan: React.FC<ActionSupportPlanProps> = ({
  currentLang,
  plan,
  onSaveScan,
  isSaved,
  onScanAnother,
  onScanWithCamera,
  weatherData
}) => {
  const t = TRANSLATIONS[currentLang];

  const [tasks, setTasks] = useState<TimelineActionItem[]>(plan.timeline_actions || []);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [activeAudioTaskId, setActiveAudioTaskId] = useState<string | null>(null);

  // Sync tasks when plan changes (e.g. language toggle or new scan)
  useEffect(() => {
    setTasks(plan.timeline_actions || []);
  }, [plan]);

  const toggleTask = (id: string) => {
    setTasks(prev => prev.map(item => 
      item.id === id ? { ...item, completed: !item.completed } : item
    ));
  };

  const handleReadSingleTask = (task: TimelineActionItem, meta: ActionMeta) => {
    if (activeAudioTaskId === task.id) {
      SpeechAssistant.stop();
      setActiveAudioTaskId(null);
      return;
    }

    const speechText = `${task.period}. ${meta.category}. Action: ${task.task}. Why this matters: ${meta.explanation}. Practical tip: ${meta.fieldTip}.`;
    setActiveAudioTaskId(task.id);
    SpeechAssistant.speak(speechText, currentLang, () => {
      setActiveAudioTaskId(null);
    });
  };

  const handleReadFullPlan = () => {
    if (isAudioPlaying) {
      SpeechAssistant.stop();
      setIsAudioPlaying(false);
      return;
    }

    const checkNowText = plan.what_to_check_now.join('. ');
    const monitorText = plan.what_to_monitor.join('. ');
    const seekHelpText = plan.when_to_seek_help.join('. ');
    
    let speech = '';
    if (currentLang === 'te') {
      speech = `${plan.crop} - ${plan.condition} కార్యాచరణ ప్రణాళిక. 1. ఇప్పుడు ఏం పరిశీలించాలి: ${checkNowText}. 2. ఏమి గమనించాలి: ${monitorText}. 3. వ్యవసాయ అధికారిని ఎప్పుడు సంప్రదించాలి: ${seekHelpText}.`;
    } else if (currentLang === 'hi') {
      speech = `${plan.crop} - ${plan.condition} कार्य योजना। 1. अभी क्या जांचें: ${checkNowText}। 2. क्या निगरानी करें: ${monitorText}। 3. विशेषज्ञ से कब संपर्क करें: ${seekHelpText}।`;
    } else {
      speech = `Action plan for ${plan.crop}, ${plan.condition}. First, What to check now: ${checkNowText}. Second, What to monitor: ${monitorText}. Third, When to seek help: ${seekHelpText}.`;
    }
    
    setIsAudioPlaying(true);
    SpeechAssistant.speak(speech, currentLang, () => {
      setIsAudioPlaying(false);
    });
  };

  const completedCount = tasks.filter(t => t.completed).length;

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-1.5 text-xs font-semibold text-primary px-2.5 py-0.5 rounded-full bg-secondary/15 border border-secondary/20 mb-1.5">
            <FileCheck2 className="w-3.5 h-3.5 text-secondary-dark" />
            <span>{t.plan_badge || "Factual Agricultural Action Plan"}</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-primary font-sans">
            {t.plan_heading}
          </h2>
          <p className="text-xs sm:text-sm text-muted mt-0.5">
            {t.plan_subheading}
          </p>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center space-x-2">
          
          <button
            onClick={handleReadFullPlan}
            className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-natural border text-xs font-semibold shadow-subtle transition-all cursor-pointer ${
              isAudioPlaying 
                ? 'bg-primary text-cream border-primary animate-pulse' 
                : 'bg-cream border-warmborder hover:bg-ivory text-charcoal'
            }`}
            title={isAudioPlaying ? t.btn_stop_tts : t.btn_listen_tts}
          >
            {isAudioPlaying ? <VolumeX className="w-4 h-4 text-cream" /> : <Volume2 className="w-4 h-4 text-primary" />}
            <span>{isAudioPlaying ? t.btn_stop_tts : t.btn_listen_tts}</span>
          </button>

          <button
            onClick={onSaveScan}
            disabled={isSaved}
            className={`flex items-center space-x-1.5 px-4 py-2 rounded-natural text-xs font-semibold shadow-subtle transition-all cursor-pointer ${
              isSaved 
                ? 'bg-secondary/20 text-secondary-dark border border-secondary/30 cursor-default' 
                : 'bg-primary hover:bg-primary-dark text-cream'
            }`}
            id="save-scan-history-btn"
          >
            <Bookmark className="w-4 h-4" />
            <span>{isSaved ? t.btn_saved_done : t.btn_save_scan}</span>
          </button>

          <button
            onClick={() => window.print()}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-natural border border-warmborder bg-cream hover:bg-ivory text-charcoal text-xs font-semibold shadow-subtle cursor-pointer"
            title="Print or Save Action Card"
          >
            <Printer className="w-4 h-4 text-primary" />
            <span className="hidden sm:inline">Print Card</span>
          </button>

        </div>
      </div>

      {/* Summary Chips */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-5">
        {plan.summary_bullets?.map((bullet, idx) => (
          <div key={idx} className="p-2.5 rounded-natural bg-ivory border border-warmborder text-[11px] font-medium text-charcoal">
            {bullet}
          </div>
        ))}
      </div>

      {/* Agro-Meteorological Weather & Soil Alert (Slide 3 & 5) */}
      <div className="mb-5 p-4 rounded-natural bg-ochre/10 border border-ochre/30 flex items-start space-x-3 text-xs shadow-subtle">
        <span className="text-xl flex-shrink-0">⛅</span>
        <div>
          <span className="font-bold text-charcoal block text-xs sm:text-sm">
            🌾 Agro-Meteorological Advisory {weatherData ? `(${weatherData.location} • ${weatherData.temperature}°C • ${weatherData.condition})` : ''}
          </span>
          <p className="text-secondary-dark mt-1 leading-relaxed">
            {weatherData?.rainfall_mm > 0 || weatherData?.humidity > 75 
              ? "⚠️ High moisture detected: Delay foliar fertilizer application, ensure field drainage furrows are cleared, and avoid handling plants while leaves are wet to prevent spreading spores."
              : "⚠️ Field Weather Alert: In case of rain forecast in next 48 hours, delay chemical/fertilizer spray and verify soil drainage channels."}
          </p>
        </div>
      </div>

      {/* Section 1: What to Check Now */}
      <div className="bg-cream border border-warmborder rounded-card p-6 shadow-card mb-5">
        <div className="flex items-center space-x-2.5 mb-4 pb-3 border-b border-warmborder">
          <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
            1
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-primary font-sans">
              {t.check_now_heading}
            </h3>
            <p className="text-xs text-muted">{t.check_now_subtitle || "Immediate physical inspection steps on foliage and soil"}</p>
          </div>
        </div>

        <ul className="space-y-3">
          {plan.what_to_check_now.map((item, idx) => (
            <li key={idx} className="flex items-start space-x-3 text-xs sm:text-sm text-charcoal">
              <span className="w-5 h-5 rounded-full bg-ivory border border-warmborder flex items-center justify-center font-bold text-[11px] text-primary mt-0.5 flex-shrink-0">
                {idx + 1}
              </span>
              <span className="leading-relaxed">{item}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Section 2: What to Monitor */}
      <div className="bg-cream border border-warmborder rounded-card p-6 shadow-card mb-5">
        <div className="flex items-center space-x-2.5 mb-4 pb-3 border-b border-warmborder">
          <div className="w-8 h-8 rounded-xl bg-ochre/15 text-ochre-dark flex items-center justify-center font-bold text-sm">
            2
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-primary font-sans">
              {t.monitor_heading}
            </h3>
            <p className="text-xs text-muted">{t.monitor_subtitle || "Observation indicators for symptom expansion over next 2 to 5 days"}</p>
          </div>
        </div>

        <ul className="space-y-3">
          {plan.what_to_monitor.map((item, idx) => (
            <li key={idx} className="flex items-start space-x-3 text-xs sm:text-sm text-charcoal">
              <Eye className="w-4 h-4 text-ochre mt-0.5 flex-shrink-0" />
              <span className="leading-relaxed">{item}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Section 3: When to Seek Help */}
      <div className="bg-cream border border-warmborder rounded-card p-6 shadow-card mb-5">
        <div className="flex items-center space-x-2.5 mb-4 pb-3 border-b border-warmborder">
          <div className="w-8 h-8 rounded-xl bg-danger-light text-danger flex items-center justify-center font-bold text-sm">
            3
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-primary font-sans">
              {t.seek_help_heading}
            </h3>
            <p className="text-xs text-muted">{t.seek_help_subtitle || "Thresholds for escalating to local agricultural extension (KVK)"}</p>
          </div>
        </div>

        <ul className="space-y-3">
          {plan.when_to_seek_help.map((item, idx) => (
            <li key={idx} className="flex items-start space-x-3 text-xs sm:text-sm text-charcoal">
              <Building2 className="w-4 h-4 text-danger mt-0.5 flex-shrink-0" />
              <span className="leading-relaxed">{item}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Section 4: Interactive Action Timeline / Checklist */}
      <div className="bg-cream border border-warmborder rounded-card p-6 shadow-card mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 mb-4 border-b border-warmborder gap-2">
          <div className="flex items-center space-x-2">
            <Clock className="w-5 h-5 text-primary" />
            <div>
              <h3 className="text-base sm:text-lg font-bold text-primary font-sans">
                {t.timeline_heading}
              </h3>
              <p className="text-xs text-muted">
                {t.timeline_action_explanation || "Step-by-step field actions explained with agricultural best practices"}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-secondary/15 border border-secondary/30 text-secondary-dark">
              {completedCount} / {tasks.length} {t.completed_badge || "Completed"}
            </span>
          </div>
        </div>

        {/* Visual Action TIMELINE Stepper with Nicer Icons */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6 p-4 rounded-2xl bg-gradient-to-r from-cream via-ivory to-cream border border-warmborder shadow-subtle">
          
          {/* Step 1 */}
          <div className="flex items-center sm:flex-col sm:text-center p-2.5 rounded-xl bg-cream border border-warmborder/80 space-x-3 sm:space-x-0">
            <div className="w-10 h-10 rounded-xl bg-emerald-500 text-cream flex items-center justify-center font-bold text-sm shadow-subtle sm:mb-2 flex-shrink-0">
              <Zap className="w-5 h-5 text-cream" />
            </div>
            <div>
              <span className="text-xs font-bold text-emerald-900 block">
                {currentLang === 'te' ? '🌅 దశ 1: ఈరోజు (తక్షణం)' : currentLang === 'hi' ? '🌅 चरण 1: आज (तत्काल)' : '🌅 Phase 1: Today'}
              </span>
              <span className="text-[11px] text-muted block mt-0.5 leading-tight">
                {currentLang === 'te' ? 'తక్షణ ఆకుల పరిశుభ్రత & తనిఖీ' : currentLang === 'hi' ? 'तत्काल स्वच्छता व खेत निरीक्षण' : 'Sanitation & Physical Inspection'}
              </span>
            </div>
          </div>

          {/* Step 2 */}
          <div className="flex items-center sm:flex-col sm:text-center p-2.5 rounded-xl bg-cream border border-warmborder/80 space-x-3 sm:space-x-0">
            <div className="w-10 h-10 rounded-xl bg-sky-500 text-cream flex items-center justify-center font-bold text-sm shadow-subtle sm:mb-2 flex-shrink-0">
              <Eye className="w-5 h-5 text-cream" />
            </div>
            <div>
              <span className="text-xs font-bold text-sky-900 block">
                {currentLang === 'te' ? '🗓️ దశ 2: 2-3 రోజుల్లో' : currentLang === 'hi' ? '🗓️ चरण 2: 2-3 दिन' : '🗓️ Phase 2: Days 2–3'}
              </span>
              <span className="text-[11px] text-muted block mt-0.5 leading-tight">
                {currentLang === 'te' ? 'వ్యాప్తి పర్యవేక్షణ & తేమ నియంత్రణ' : currentLang === 'hi' ? 'फैलाव निगरानी व नमी नियंत्रण' : 'Spread Monitoring & Moisture'}
              </span>
            </div>
          </div>

          {/* Step 3 */}
          <div className="flex items-center sm:flex-col sm:text-center p-2.5 rounded-xl bg-cream border border-warmborder/80 space-x-3 sm:space-x-0">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-cream flex items-center justify-center font-bold text-sm shadow-subtle sm:mb-2 flex-shrink-0">
              <Building2 className="w-5 h-5 text-cream" />
            </div>
            <div>
              <span className="text-xs font-bold text-amber-900 block">
                {currentLang === 'te' ? '🔬 దశ 3: 5 రోజుల తర్వాత' : currentLang === 'hi' ? '🔬 चरण 3: 5 दिन बाद' : '🔬 Phase 3: Day 5+'}
              </span>
              <span className="text-[11px] text-muted block mt-0.5 leading-tight">
                {currentLang === 'te' ? 'పునఃపరిశీలన & KVK సంప్రదింపు' : currentLang === 'hi' ? 'समीक्षा व कृषि विज्ञान केंद्र संपर्क' : 'Recovery Review & KVK Extension'}
              </span>
            </div>
          </div>

        </div>

        {/* Action Cards List with Rich Icons and Explanations */}
        <div className="space-y-4">
          {tasks.map((task) => {
            const meta = getActionMeta(task.task, task.period, currentLang);
            const isTaskPlaying = activeAudioTaskId === task.id;

            return (
              <div
                key={task.id}
                className={`p-4 rounded-2xl border transition-all shadow-subtle relative ${
                  task.completed
                    ? 'bg-secondary/10 border-secondary/40 opacity-80'
                    : 'bg-ivory/70 border-warmborder hover:border-primary/40 hover:bg-ivory'
                }`}
              >
                {/* Top Row: Meta Badges + Audio */}
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
                  <div className="flex items-center flex-wrap gap-2">
                    {/* Period badge */}
                    <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${meta.periodBadge}`}>
                      {meta.periodLabel}
                    </span>

                    {/* Category with icon */}
                    <span className={`inline-flex items-center space-x-1.5 text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${meta.badgeBg}`}>
                      {meta.icon}
                      <span>{meta.category}</span>
                    </span>
                  </div>

                  <div className="flex items-center space-x-1.5">
                    {/* Read single task audio */}
                    <button
                      type="button"
                      onClick={() => handleReadSingleTask(task, meta)}
                      className={`p-1.5 rounded-lg border text-xs transition-colors cursor-pointer flex items-center space-x-1 ${
                        isTaskPlaying
                          ? 'bg-primary text-cream border-primary animate-pulse'
                          : 'bg-cream border-warmborder hover:bg-white text-charcoal'
                      }`}
                      title={isTaskPlaying ? "Stop audio" : "Listen to this action and explanation"}
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                      <span className="text-[10px] font-semibold hidden sm:inline">
                        {isTaskPlaying ? "Playing" : "Listen"}
                      </span>
                    </button>

                    {/* Checkbox trigger button */}
                    <button
                      type="button"
                      onClick={() => toggleTask(task.id)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-colors cursor-pointer flex items-center space-x-1 ${
                        task.completed
                          ? 'bg-emerald-600 text-white border-emerald-700'
                          : 'bg-cream hover:bg-white text-charcoal border-warmborder'
                      }`}
                    >
                      {task.completed ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>{t.completed_badge || "Done"}</span>
                        </>
                      ) : (
                        <>
                          <Square className="w-3.5 h-3.5 text-muted" />
                          <span>{t.pending_badge || "Mark Done"}</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Main Task Description */}
                <div 
                  onClick={() => toggleTask(task.id)}
                  className="cursor-pointer mb-3 flex items-start space-x-3"
                >
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 border shadow-subtle ${meta.iconBg}`}>
                    {meta.icon}
                  </div>
                  <div className="flex-1">
                    <p className={`text-xs sm:text-sm font-semibold leading-relaxed ${
                      task.completed ? 'line-through text-muted' : 'text-charcoal'
                    }`}>
                      {task.task}
                    </p>
                  </div>
                </div>

                {/* Action Explanation & Guide Box */}
                <div className="p-3 rounded-xl bg-cream/90 border border-warmborder/80 text-xs space-y-1.5">
                  <div className="flex items-start space-x-2">
                    <Lightbulb className="w-4 h-4 text-ochre-dark flex-shrink-0 mt-0.5" />
                    <p className="text-[11px] sm:text-xs text-charcoal leading-relaxed">
                      <strong className="text-primary font-bold">
                        {currentLang === 'te' ? 'ఈ చర్య ఎందుకు ముఖ్యం: ' : currentLang === 'hi' ? 'यह कदम क्यों आवश्यक है: ' : 'Why this matters: '}
                      </strong>
                      {meta.explanation}
                    </p>
                  </div>

                  <div className="flex items-start space-x-2 pt-1 border-t border-warmborder/50">
                    <span className="text-[11px] text-secondary-dark font-bold flex-shrink-0">
                      💡 {currentLang === 'te' ? 'క్షేత్ర చిట్కా:' : currentLang === 'hi' ? 'व्यावहारिक सुझाव:' : 'Practical Field Tip:'}
                    </span>
                    <p className="text-[11px] text-muted-dark leading-relaxed">
                      {meta.fieldTip}
                    </p>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      </div>

      {/* Safety Notice Card */}
      <div className="p-4 rounded-natural bg-ivory border border-warmborder flex items-start space-x-3 mb-6">
        <ShieldCheck className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
        <div className="text-xs leading-relaxed text-charcoal">
          <span className="font-bold text-primary">{t.safety_title}: </span>
          <span>{plan.safety_note}</span>
        </div>
      </div>

      {/* Footer Navigation */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-warmborder">
        <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full sm:w-auto">
          {/* Real Life Camera Scan Button */}
          <button
            type="button"
            onClick={onScanWithCamera || onScanAnother}
            className="w-full sm:w-auto px-6 py-3.5 rounded-natural bg-secondary hover:bg-secondary-dark active:scale-95 text-cream font-bold text-sm shadow-subtle flex items-center justify-center space-x-2 transition-all cursor-pointer"
            id="plan-camera-scan-btn"
            title="Turn on live camera to capture a real plant leaf in field"
          >
            <Camera className="w-4 h-4 text-cream" />
            <span>{t.scan_real_camera || "Scan Real Leaf (Turn ON Camera)"}</span>
          </button>

          {/* Standard Scan Another Button */}
          <button
            type="button"
            onClick={onScanAnother}
            className="w-full sm:w-auto px-5 py-3.5 rounded-natural bg-ivory hover:bg-ivory-dark text-charcoal font-medium text-sm border border-warmborder flex items-center justify-center space-x-2 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-4 h-4 text-muted" />
            <span>{t.scan_another_action}</span>
          </button>
        </div>

        <span className="text-xs text-muted text-center sm:text-right">
          {t.footer_tagline || "Avani Crop Health Intelligence • Grounded in Agricultural Standards"}
        </span>
      </div>

    </div>
  );
};
