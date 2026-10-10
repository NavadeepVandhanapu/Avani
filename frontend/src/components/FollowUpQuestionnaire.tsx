import React, { useState, useEffect } from 'react';
import { ArrowLeft, ArrowRight, Check, Sparkles, Volume2, Mic, Radio } from 'lucide-react';
import type { Language, FollowUpAnswers } from '../types';
import { TRANSLATIONS } from '../translations';
import { SpeechAssistant, VoiceInputService } from '../utils/speech';

interface FollowUpQuestionnaireProps {
  currentLang: Language;
  initialCrop?: string;
  onComplete: (answers: FollowUpAnswers) => void;
  onBackToResult: () => void;
}

interface QuestionConfig {
  id: keyof FollowUpAnswers;
  question: {
    en: string;
    te: string;
    hi: string;
  };
  subtitle: {
    en: string;
    te: string;
    hi: string;
  };
  options: {
    label: { en: string; te: string; hi: string };
    value: string;
    desc?: { en: string; te: string; hi: string };
  }[];
}

const QUESTIONS: QuestionConfig[] = [
  {
    id: 'q1_crop',
    question: {
      en: 'Which crop are you checking?',
      te: 'మీరు ఏ పంటను పరీక్షిస్తున్నారు?',
      hi: 'आप किस फसल की जांच कर रहे हैं?'
    },
    subtitle: {
      en: 'Select the primary crop in your field.',
      te: 'మీ పొలంలో ఉన్న ప్రధాన పంటను ఎంచుకోండి.',
      hi: 'अपने खेत की मुख्य फसल चुनें।'
    },
    options: [
      { label: { en: 'Tomato', te: 'టమోటా', hi: 'टमाटर' }, value: 'Tomato' },
      { label: { en: 'Potato', te: 'బంగాళాదుంప', hi: 'आलू' }, value: 'Potato' },
      { label: { en: 'Corn / Maize', te: 'మొక్కజొన్న', hi: 'मक्का' }, value: 'Corn (Maize)' },
      { label: { en: 'Pepper / Capsicum / Chili', te: 'మిరప / కాప్సికం', hi: 'मिर्च / शिमला मिर्च' }, value: 'Pepper / Chili' },
      { label: { en: 'Apple', te: 'యాపిల్', hi: 'सेब' }, value: 'Apple' },
      { label: { en: 'Grape', te: 'ద్రాక్ష', hi: 'अंगूर' }, value: 'Grape' },
      { label: { en: 'Rice / Paddy', te: 'వరి', hi: 'धान / चावल' }, value: 'Rice (Paddy)' },
      { label: { en: 'Other Vegetable / Crop', te: 'ఇతర కూరగాయ / పంట', hi: 'अन्य सब्जी / फसल' }, value: 'Other' }
    ]
  },
  {
    id: 'q2_age',
    question: {
      en: 'What is the growth stage of the crop?',
      te: 'పంట ప్రస్తుతం ఏ దశలో ఉంది?',
      hi: 'फसल इस समय किस अवस्था में है?'
    },
    subtitle: {
      en: 'Age and growth stage determine plant vulnerability.',
      te: 'పంట వయస్సును బట్టి రక్షణ చర్యలు మారుతాయి.',
      hi: 'फसल की अवस्था के अनुसार देखभाल के कदम तय होते हैं।'
    },
    options: [
      { label: { en: 'Young Seedling (First few weeks)', te: 'చిన్న మొలక / నారు దశ', hi: 'छोटा पौधा / पौध अवस्था' }, value: 'Seedling / Early' },
      { label: { en: 'Vegetative Growth (Branching & Leaves)', te: 'శాఖీయ పెరుగుదల దశ (ఆకులు, కొమ్మలు)', hi: 'वानस्पतिक वृद्धि (पत्तियां व शाखाएं)' }, value: 'Vegetative Growth' },
      { label: { en: 'Flowering Stage (Buds & Blossoms)', te: 'పూత దశ', hi: 'फूल आने की अवस्था' }, value: 'Flowering Stage' },
      { label: { en: 'Fruiting / Tuber / Grain Filling', te: 'కాత / గింజ / కాయల దశ', hi: 'फल / दाना भरने की अवस्था' }, value: 'Fruiting / Maturity' }
    ]
  },
  {
    id: 'q3_field_affected',
    question: {
      en: 'How much of your field is showing symptoms?',
      te: 'పొలంలో ఎంత శాతం పంటపై లక్షణాలు కనిపిస్తున్నాయి?',
      hi: 'खेत के कितने हिस्से में ये लक्षण दिख रहे हैं?'
    },
    subtitle: {
      en: 'Helps assess whether symptoms are isolated or spreading.',
      te: 'సమస్య చిన్న స్థాయిలో ఉందా లేదా పొలమంతా విస్తరించిందా అని తెలుసుకునేందుకు.',
      hi: 'यह जानने के लिए कि समस्या सीमित है या पूरे खेत में फैल रही है।'
    },
    options: [
      { label: { en: 'Isolated (< 5% of plants)', te: 'చాలా తక్కువ (5% లోపు మొక్కలు)', hi: 'बहुत कम (5% से कम पौधे)' }, value: '< 5% (Isolated plants)' },
      { label: { en: 'Scattered Patches (5% to 20%)', te: 'కొన్ని ప్యాచ్‌లలో (5% నుండి 20%)', hi: 'कुछ हिस्सों में (5% से 20%)' }, value: '5-20% (Scattered patches)' },
      { label: { en: 'Widespread (20% to 50%)', te: 'మధ్యస్థంగా (20% నుండి 50%)', hi: 'मध्यम स्तर पर (20% से 50%)' }, value: '20-50% (Widespread)' },
      { label: { en: 'Severe / Majority of Field (> 50%)', te: 'తీవ్రంగా / సగానికి పైగా (> 50%)', hi: 'गंभीर / आधे से अधिक (> 50%)' }, value: '> 50% (Severe)' }
    ]
  },
  {
    id: 'q4_companion_crops',
    question: {
      en: 'Are there other crops growing in or beside this field?',
      te: 'ఈ పొలంలో లేదా పక్కనే ఇతర పంటలు ఏవైనా ఉన్నాయా?',
      hi: 'क्या इस खेत में या पास में कोई अन्य फसल लगी है?'
    },
    subtitle: {
      en: 'Some pathogens spread easily across mixed crops.',
      te: 'కొన్ని తెగుళ్ళు సమీప పంటలకు సులభంగా వ్యాపిస్తాయి.',
      hi: 'कुछ बीमारियां पास की फसलों में तेजी से फैल सकती हैं।'
    },
    options: [
      { label: { en: 'Single crop only (No other crops)', te: 'ఒకే పంట మాత్రమే (వేరే పంటలు లేవు)', hi: 'केवल यही एकल फसल' }, value: 'None / Single Crop' },
      { label: { en: 'Chili, Pepper, or Tomato nearby', te: 'పక్కనే మిరప లేదా టమోటా ఉన్నాయి', hi: 'पास में मिर्च या टमाटर है' }, value: 'Solanaceous / Chili' },
      { label: { en: 'Pulses, Beans, or Legumes', te: 'పప్పుధాన్యాల పంటలు', hi: 'दालें या फलियां' }, value: 'Legumes / Pulses' },
      { label: { en: 'Other mixed vegetables', te: 'ఇతర కూరగాయలు', hi: 'अन्य मिश्रित सब्जियां' }, value: 'Mixed Vegetables' }
    ]
  },
  {
    id: 'q5_weeds',
    question: {
      en: 'Are weeds present around the crop?',
      te: 'పంట చుట్టూ కలుపు మొక్కలు ఎక్కువగా ఉన్నాయా?',
      hi: 'क्या फसल के आसपास खरपतवार (घास-फूंस) है?'
    },
    subtitle: {
      en: 'Weeds can harbor fungal spores and insect vectors.',
      te: 'కలుపు మొక్కలు పురుగులు మరియు తెగుళ్ళకు ఆవాసంగా మారతాయి.',
      hi: 'खरपतवार फफूंद और कीटों को पनाह देते हैं।'
    },
    options: [
      { label: { en: 'Clean field (Virtually no weeds)', te: 'పరిశుభ్రమైన పొలం (కలుపు లేదు)', hi: 'साफ खेत (खरपतवार नहीं है)' }, value: 'Low / Clean field' },
      { label: { en: 'Moderate weeds along rows or bunds', te: 'గట్లు లేదా సాల్ల వెంట కొద్దిగా కలుపు ఉంది', hi: 'मेड़ों पर मध्यम खरपतवार' }, value: 'Moderate weeds' },
      { label: { en: 'Heavy weed cover around crop', te: 'పంట చుట్టూ కలుపు చాలా ఎక్కువగా ఉంది', hi: 'फसल के आसपास घना खरपतवार' }, value: 'Heavy weeds' }
    ]
  },
  {
    id: 'q6_first_appeared',
    question: {
      en: 'When did you first notice these symptoms?',
      te: 'ఈ లక్షణాలు ఎప్పుడు మొదటిసారి గమనించారు?',
      hi: 'ये लक्षण सबसे पहले कब दिखाई दिए?'
    },
    subtitle: {
      en: 'Helps determine the speed of development.',
      te: 'వ్యాధి వ్యాప్తి వేగాన్ని అంచనా వేసేందుకు.',
      hi: 'रोग की प्रगति की गति समझने के लिए।'
    },
    options: [
      { label: { en: 'Just 1 to 2 days ago (Very fresh)', te: '1-2 రోజుల క్రితమే (ఇప్పుడే మొదలైంది)', hi: 'सिर्फ 1-2 दिन पहले (बिल्कुल नया)' }, value: '1-2 days ago' },
      { label: { en: 'About a week ago', te: 'సుమారు ఒక వారం క్రితం', hi: 'लगभग एक सप्ताह पहले' }, value: 'About 1 week ago' },
      { label: { en: 'More than 2 weeks ago', te: 'రెండు వారాల కంటే ఎక్కువ కాలం క్రితం', hi: '2 सप्ताह से अधिक समय से' }, value: 'More than 2 weeks ago' }
    ]
  },
  {
    id: 'q7_spreading',
    question: {
      en: 'Are the symptoms spreading to other leaves or plants?',
      te: 'ఈ మచ్చలు ఇతర ఆకులకు లేదా పక్క మొక్కలకు పాకుతున్నాయా?',
      hi: 'क्या ये लक्षण दूसरी पत्तियों या पौधों में फैल रहे हैं?'
    },
    subtitle: {
      en: 'Crucial for deciding immediate isolation or pruning steps.',
      te: 'మొక్కలను వేరుచేయడం లేదా కొమ్మలు కత్తిరించడం నిర్ణయించేందుకు.',
      hi: 'तुरंत छंटाई या रोकथाम कदम तय करने के लिए।'
    },
    options: [
      { label: { en: 'Not spreading (Stationary on same leaves)', te: 'పాకడం లేదు (అక్కడే ఉన్నాయి)', hi: 'फैल नहीं रहा (स्थिर है)' }, value: 'Not spreading' },
      { label: { en: 'Spreading slowly to adjacent leaves', te: 'పక్క ఆకులకు నెమ్మదిగా పాకుతున్నాయి', hi: 'पास की पत्तियों में धीरे-धीरे फैल रहा है' }, value: 'Spreading slowly' },
      { label: { en: 'Spreading rapidly across rows', te: 'చాలా వేగంగా పొలమంతా విస్తరిస్తోంది', hi: 'तेजी से पूरे खेत में फैल रहा है' }, value: 'Spreading rapidly' }
    ]
  },
  {
    id: 'q8_weather_watering',
    question: {
      en: 'Recent changes in weather or watering methods?',
      te: 'ఇటీవల వర్షం లేదా నీటి పారుదలలో మార్పులు ఏమైనా జరిగాయా?',
      hi: 'हाल ही में मौसम या सिंचाई में कोई बदलाव हुआ?'
    },
    subtitle: {
      en: 'Moisture and temperature drive fungal and bacterial development.',
      te: 'తేమ మరియు వర్షం తెగుళ్ళ వ్యాప్తిని పెంచుతాయి.',
      hi: 'नमी और बारिश से रोग तेजी से पनपते हैं।'
    },
    options: [
      { label: { en: 'Heavy rain, morning fog, or high humidity', te: 'భారీ వర్షం, పొగమంచు లేదా అధిక తేమ', hi: 'भारी बारिश, कोहरा या अधिक नमी' }, value: 'Heavy rain / fog' },
      { label: { en: 'Overhead sprinkler / splash watering', te: 'స్ప్రింక్లర్ ద్వారా పైనుంచి నీరు చల్లడం', hi: 'फव्वारा / ऊपर से पानी का छिड़काव' }, value: 'Overhead watering' },
      { label: { en: 'Normal drip irrigation / soil furrow', te: 'డ్రిప్ లేదా నేల ద్వారా సాధారణ నీటి పారుదల', hi: 'ड्रिप या नाली से सामान्य सिंचाई' }, value: 'Normal drip / furrow' },
      { label: { en: 'Dry spell or water deficit', te: 'ఎండ తీవ్రత / నీటి కొరత', hi: 'सूखा या पानी की कमी' }, value: 'Dry / drought' }
    ]
  }
];

export const FollowUpQuestionnaire: React.FC<FollowUpQuestionnaireProps> = ({
  currentLang,
  initialCrop,
  onComplete,
  onBackToResult
}) => {
  const t = TRANSLATIONS[currentLang];

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<FollowUpAnswers>({
    q1_crop: initialCrop || 'Tomato'
  });

  const currentQ = QUESTIONS[currentIndex];
  const isLast = currentIndex === QUESTIONS.length - 1;

  const handleSelectOption = (val: string) => {
    setAnswers(prev => ({
      ...prev,
      [currentQ.id]: val
    }));
  };

  const handleNext = () => {
    if (isLast) {
      onComplete(answers);
    } else {
      setCurrentIndex(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    } else {
      onBackToResult();
    }
  };

  const handleSkip = () => {
    handleNext();
  };

  const handleReadQuestion = () => {
    const qText = `${currentQ.question[currentLang]}. ${currentQ.subtitle[currentLang]}`;
    SpeechAssistant.speak(qText, currentLang);
  };

  const [isListening, setIsListening] = useState(false);
  const [spokenTranscript, setSpokenTranscript] = useState('');
  const [voiceFeedback, setVoiceFeedback] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      VoiceInputService.stopListening();
    };
  }, []);

  useEffect(() => {
    setSpokenTranscript('');
    setVoiceFeedback(null);
    VoiceInputService.stopListening();
    setIsListening(false);
  }, [currentIndex]);

  const toggleVoiceInput = () => {
    if (isListening) {
      VoiceInputService.stopListening();
      setIsListening(false);
      return;
    }

    setSpokenTranscript('');
    setVoiceFeedback(null);
    setIsListening(true);

    VoiceInputService.startListening({
      lang: currentLang,
      onResult: (transcript, isFinal) => {
        setSpokenTranscript(transcript);

        const lower = transcript.toLowerCase();
        if (lower.includes('next') || lower.includes('తరువాత') || lower.includes('आगे') || lower.includes('ముందుకు')) {
          handleNext();
          VoiceInputService.stopListening();
          setIsListening(false);
          return;
        }

        const matched = VoiceInputService.matchOption(transcript, currentQ.options, currentLang);
        if (matched) {
          handleSelectOption(matched);
          const opt = currentQ.options.find(o => o.value === matched);
          const optName = opt ? opt.label[currentLang] : matched;
          setVoiceFeedback(`✓ ${optName}`);
          if (isFinal) {
            SpeechAssistant.speak(`Selected ${optName}`, currentLang);
          }
        }
      },
      onError: (err) => {
        console.warn('Voice recognition error:', err);
        setIsListening(false);
      },
      onEnd: () => {
        setIsListening(false);
      }
    });
  };

  const selectedVal = answers[currentQ.id];

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      
      {/* Header & Step Tracker */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-primary px-2.5 py-0.5 rounded-full bg-ivory border border-warmborder">
              {t.step_indicator} {currentIndex + 1} {t.of_indicator} {QUESTIONS.length}
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-primary font-sans mt-1.5">
            {t.questionnaire_heading}
          </h2>
        </div>

        <div className="flex items-center space-x-2">
          {/* Read question aloud */}
          <button
            onClick={handleReadQuestion}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-warmborder bg-cream hover:bg-ivory text-xs font-medium text-charcoal shadow-subtle cursor-pointer"
            title={t.btn_listen_tts}
          >
            <Volume2 className="w-3.5 h-3.5 text-primary" />
            <span className="hidden sm:inline">{t.btn_listen_tts}</span>
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-ivory rounded-full h-2 mb-6 border border-warmborder overflow-hidden">
        <div 
          className="bg-primary h-2 rounded-full transition-all duration-300"
          style={{ width: `${((currentIndex + 1) / QUESTIONS.length) * 100}%` }}
        ></div>
      </div>

      {/* Question Card */}
      <div className="bg-cream border border-warmborder rounded-card p-6 sm:p-8 shadow-card">
        
        <div className="mb-5 flex flex-col sm:flex-row sm:items-start justify-between gap-3">
          <div>
            <h3 className="text-lg sm:text-xl font-bold text-charcoal font-sans">
              {currentQ.question[currentLang]}
            </h3>
            <p className="text-xs sm:text-sm text-muted mt-1">
              {currentQ.subtitle[currentLang]}
            </p>
          </div>

          {/* Voice Answer Mic Button */}
          <button
            type="button"
            onClick={toggleVoiceInput}
            className={`flex-shrink-0 px-3.5 py-2 rounded-xl text-xs font-bold flex items-center space-x-2 transition-all cursor-pointer shadow-subtle ${
              isListening
                ? 'bg-danger text-white animate-pulse ring-2 ring-danger/40'
                : 'bg-primary/10 text-primary border border-primary/30 hover:bg-primary hover:text-white'
            }`}
            title="Speak your answer in Telugu, Hindi, or English"
          >
            {isListening ? (
              <>
                <Radio className="w-4 h-4 animate-spin text-white" />
                <span>Listening ({currentLang === 'te' ? 'తెలుగు' : currentLang === 'hi' ? 'हिन्दी' : 'English'})...</span>
              </>
            ) : (
              <>
                <Mic className="w-4 h-4" />
                <span>{currentLang === 'te' ? 'వాయిస్ సమాధానం' : currentLang === 'hi' ? 'बोलकर उत्तर दें' : 'Speak Answer'}</span>
              </>
            )}
          </button>
        </div>

        {/* Live Spoken Transcript Feedback */}
        {(isListening || spokenTranscript || voiceFeedback) && (
          <div className="mb-5 p-3 rounded-xl bg-ivory border border-warmborder text-xs flex flex-wrap items-center justify-between gap-2 animate-fadeIn">
            <div className="flex items-center space-x-2">
              <span className="font-semibold text-charcoal">
                {isListening ? '🎙️ Spoken Input:' : '🗣️ Captured:'}
              </span>
              <span className="text-primary font-medium italic">
                {spokenTranscript || (isListening ? 'Speak now in your chosen language...' : '')}
              </span>
            </div>
            {voiceFeedback && (
              <span className="bg-secondary/20 text-primary-dark px-2.5 py-0.5 rounded-full font-bold text-[11px]">
                {voiceFeedback}
              </span>
            )}
          </div>
        )}

        {/* Option Choices */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
          {currentQ.options.map((opt, idx) => {
            const isSelected = selectedVal === opt.value;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => handleSelectOption(opt.value)}
                className={`p-4 rounded-natural border text-left transition-all flex items-start justify-between space-x-3 ${
                  isSelected
                    ? 'border-primary bg-secondary/10 shadow-subtle ring-1 ring-primary'
                    : 'border-warmborder bg-ivory/40 hover:bg-ivory hover:border-warmborder-dark'
                }`}
              >
                <div className="flex-1">
                  <p className={`text-sm font-semibold ${isSelected ? 'text-primary' : 'text-charcoal'}`}>
                    {opt.label[currentLang]}
                  </p>
                </div>
                <div className={`w-5 h-5 rounded-full border flex items-center justify-center flex-shrink-0 mt-0.5 ${
                  isSelected ? 'border-primary bg-primary text-cream' : 'border-warmborder-dark bg-cream'
                }`}>
                  {isSelected && <Check className="w-3 h-3 text-cream" />}
                </div>
              </button>
            );
          })}
        </div>

        {/* Navigation Actions */}
        <div className="flex items-center justify-between pt-5 border-t border-warmborder">
          
          <button
            type="button"
            onClick={handleBack}
            className="px-4 py-2.5 rounded-natural border border-warmborder bg-ivory text-charcoal hover:bg-ivory-dark font-medium text-xs sm:text-sm flex items-center space-x-1.5 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-muted" />
            <span>{t.btn_back}</span>
          </button>

          <div className="flex items-center space-x-3">
            {!isLast && (
              <button
                type="button"
                onClick={handleSkip}
                className="px-3 py-2 text-xs text-muted hover:text-charcoal font-medium"
              >
                {t.btn_skip}
              </button>
            )}

            <button
              type="button"
              onClick={handleNext}
              className="px-6 py-3 rounded-natural bg-primary hover:bg-primary-dark text-cream font-bold text-xs sm:text-sm shadow-subtle flex items-center space-x-2 transition-all active:scale-95"
              id="question-next-btn"
            >
              <span>{isLast ? t.btn_finish : t.btn_next}</span>
              {isLast ? <Sparkles className="w-4 h-4 text-ochre" /> : <ArrowRight className="w-4 h-4 text-cream" />}
            </button>
          </div>

        </div>

      </div>

    </div>
  );
};
