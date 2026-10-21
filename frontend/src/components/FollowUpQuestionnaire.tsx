import React, { useState, useEffect, useMemo } from 'react';
import { ArrowLeft, ArrowRight, Check, Sparkles, Volume2, Mic, Radio } from 'lucide-react';
import type { Language, FollowUpAnswers, PredictionResponse } from '../types';
import { TRANSLATIONS } from '../translations';
import { SpeechAssistant, VoiceInputService } from '../utils/speech';
import { getDynamicQuestions, getQuestionnaireCategory } from '../utils/dynamicQuestions';

interface FollowUpQuestionnaireProps {
  currentLang: Language;
  initialCrop?: string;
  prediction?: PredictionResponse | null;
  onComplete: (answers: FollowUpAnswers) => void;
  onBackToResult: () => void;
}

export const FollowUpQuestionnaire: React.FC<FollowUpQuestionnaireProps> = ({
  currentLang,
  initialCrop,
  prediction,
  onComplete,
  onBackToResult
}) => {
  const t = TRANSLATIONS[currentLang];

  // Dynamically select targeted questions based on the active scan prediction result
  const questions = useMemo(() => getDynamicQuestions(prediction), [prediction]);
  const category = useMemo(() => getQuestionnaireCategory(prediction), [prediction]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<FollowUpAnswers>(() => {
    const base: FollowUpAnswers = {};
    if (prediction?.crop || initialCrop) {
      base.q1_crop = prediction?.crop || initialCrop || 'Tomato';
    }
    return base;
  });

  // Reset questionnaire state whenever a new scan prediction is provided
  useEffect(() => {
    setCurrentIndex(0);
    setAnswers({
      q1_crop: prediction?.crop || initialCrop || 'Tomato'
    });
  }, [prediction, initialCrop]);

  const safeIndex = Math.min(currentIndex, Math.max(0, questions.length - 1));
  const currentQ = questions[safeIndex];
  const isLast = safeIndex === questions.length - 1;

  const handleSelectOption = (val: string) => {
    if (!currentQ) return;
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
    if (safeIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    } else {
      onBackToResult();
    }
  };

  const handleSkip = () => {
    handleNext();
  };

  const handleReadQuestion = () => {
    if (!currentQ) return;
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
  }, [safeIndex]);

  const toggleVoiceInput = async () => {
    if (!currentQ) return;

    if (isListening) {
      VoiceInputService.stopListening();
      setIsListening(false);
      return;
    }

    // Stop question reading so microphone doesn't pick up speaker sound
    SpeechAssistant.stop();

    setSpokenTranscript('');
    setVoiceFeedback(null);
    setIsListening(true);

    const started = await VoiceInputService.startListening({
      lang: currentLang,
      onResult: (transcript, isFinal) => {
        setSpokenTranscript(transcript);

        const lower = transcript.toLowerCase().trim();

        // 1. Voice navigation commands
        if (
          lower.includes('next') ||
          lower.includes('తరువాత') ||
          lower.includes('आगे') ||
          lower.includes('ముందుకు') ||
          lower.includes('నెక్స్ట్')
        ) {
          VoiceInputService.stopListening();
          setIsListening(false);
          setVoiceFeedback('⏩ Next');
          handleNext();
          return;
        }

        if (
          lower.includes('back') ||
          lower.includes('వెనుకకు') ||
          lower.includes('వెనక్కి') ||
          lower.includes('पीछे')
        ) {
          VoiceInputService.stopListening();
          setIsListening(false);
          setVoiceFeedback('⏪ Back');
          handleBack();
          return;
        }

        if (
          lower.includes('read') ||
          lower.includes('చదువు') ||
          lower.includes('వినండి') ||
          lower.includes('सुनो')
        ) {
          VoiceInputService.stopListening();
          setIsListening(false);
          handleReadQuestion();
          return;
        }

        // 2. Option matching (by index, label substring, or agronomic keywords)
        const matched = VoiceInputService.matchOption(transcript, currentQ.options, currentLang);
        if (matched) {
          handleSelectOption(matched);
          const opt = currentQ.options.find(o => o.value === matched);
          const optName = opt ? opt.label[currentLang] : matched;
          setVoiceFeedback(`✓ ${optName}`);
          if (isFinal) {
            VoiceInputService.stopListening();
            setIsListening(false);
            const confirmMsg = currentLang === 'te' 
              ? `${optName} ఎంచుకోబడింది` 
              : currentLang === 'hi' 
              ? `${optName} चुना गया` 
              : `Selected ${optName}`;
            SpeechAssistant.speak(confirmMsg, currentLang);
          }
        } else if (isFinal) {
          const hintMsg = currentLang === 'te'
            ? 'సరిపోలలేదు — ఆప్షన్ 1, 2, 3 లేదా సమాధానం చెప్పండి'
            : currentLang === 'hi'
            ? 'विकल्प नहीं मिला — विकल्प 1, 2, 3 या नाम बोलें'
            : 'No match — Say option 1, 2, 3 or option name';
          setVoiceFeedback(`❓ ${hintMsg}`);
        }
      },
      onError: (err, code) => {
        console.warn('Voice recognition error:', err, code);
        setIsListening(false);
        setVoiceFeedback(`⚠️ ${err}`);
      },
      onEnd: () => {
        setIsListening(false);
      }
    });

    if (!started) {
      setIsListening(false);
    }
  };

  if (!currentQ) {
    return (
      <div className="max-w-md mx-auto p-6 text-center">
        <p className="text-muted text-sm">Loading targeted questionnaire...</p>
      </div>
    );
  }

  const selectedVal = answers[currentQ.id];

  const categoryBadgeLabel =
    category === 'healthy'
      ? t.questionnaire_cat_healthy
      : category === 'uncertain'
      ? t.questionnaire_cat_uncertain
      : category === 'leaf_spot'
      ? t.questionnaire_cat_leaf_spot
      : category === 'blight'
      ? t.questionnaire_cat_blight
      : category === 'rust'
      ? t.questionnaire_cat_rust
      : category === 'mildew'
      ? t.questionnaire_cat_mildew
      : category === 'viral'
      ? t.questionnaire_cat_viral
      : t.questionnaire_cat_general;

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      {/* Header & Step Tracker */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-2 flex-wrap gap-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-primary px-2.5 py-0.5 rounded-full bg-ivory border border-warmborder">
              {t.step_indicator} {safeIndex + 1} {t.of_indicator} {questions.length}
            </span>
            <span className="text-[11px] font-semibold text-secondary-dark px-2.5 py-0.5 rounded-full bg-secondary/15 border border-secondary/30">
              {categoryBadgeLabel}
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-primary font-sans mt-1.5">
            {t.questionnaire_heading}
          </h2>
          <p className="text-xs text-muted mt-0.5">
            {t.questionnaire_subheading}
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {/* Read question aloud */}
          <button
            onClick={handleReadQuestion}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-warmborder bg-cream hover:bg-ivory text-xs font-medium text-charcoal shadow-subtle cursor-pointer transition-colors"
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
          style={{ width: `${((safeIndex + 1) / questions.length) * 100}%` }}
        ></div>
      </div>

      {/* Question Card */}
      <div className="bg-cream border border-warmborder rounded-card p-6 sm:p-8 shadow-card">
        <div className="mb-5 flex flex-col sm:flex-row sm:items-start justify-between gap-3">
          <div>
            <h3 className="text-lg sm:text-xl font-bold text-charcoal font-sans">
              {currentQ.question[currentLang]}
            </h3>
            <p className="text-xs sm:text-sm text-muted mt-1 leading-relaxed">
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
                <span>
                  Listening (
                  {currentLang === 'te'
                    ? 'తెలుగు'
                    : currentLang === 'hi'
                    ? 'हिन्दी'
                    : 'English'}
                  )...
                </span>
              </>
            ) : (
              <>
                <Mic className="w-4 h-4" />
                <span>
                  {currentLang === 'te'
                    ? 'వాయిస్ సమాధానం'
                    : currentLang === 'hi'
                    ? 'बोलकर उत्तर दें'
                    : 'Speak Answer'}
                </span>
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
                {spokenTranscript ||
                  (isListening ? 'Speak now in your chosen language...' : '')}
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
                className={`p-4 rounded-natural border text-left transition-all flex items-start justify-between space-x-3 cursor-pointer ${
                  isSelected
                    ? 'border-primary bg-secondary/10 shadow-subtle ring-1 ring-primary'
                    : 'border-warmborder bg-ivory/40 hover:bg-ivory hover:border-warmborder-dark'
                }`}
              >
                <div className="flex-1">
                  <p
                    className={`text-sm font-semibold ${
                      isSelected ? 'text-primary' : 'text-charcoal'
                    }`}
                  >
                    {opt.label[currentLang]}
                  </p>
                </div>
                <div
                  className={`w-5 h-5 rounded-full border flex items-center justify-center flex-shrink-0 mt-0.5 ${
                    isSelected
                      ? 'border-primary bg-primary text-cream'
                      : 'border-warmborder-dark bg-cream'
                  }`}
                >
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
            className="px-4 py-2.5 rounded-natural border border-warmborder bg-ivory text-charcoal hover:bg-ivory-dark font-medium text-xs sm:text-sm flex items-center space-x-1.5 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 text-muted" />
            <span>{t.btn_back}</span>
          </button>

          <div className="flex items-center space-x-3">
            {!isLast && (
              <button
                type="button"
                onClick={handleSkip}
                className="px-3 py-2 text-xs text-muted hover:text-charcoal font-medium cursor-pointer"
              >
                {t.btn_skip}
              </button>
            )}

            <button
              type="button"
              onClick={handleNext}
              className="px-6 py-3 rounded-natural bg-primary hover:bg-primary-dark text-cream font-bold text-xs sm:text-sm shadow-subtle flex items-center space-x-2 transition-all active:scale-95 cursor-pointer"
              id="question-next-btn"
            >
              <span>{isLast ? t.btn_finish : t.btn_next}</span>
              {isLast ? (
                <Sparkles className="w-4 h-4 text-ochre" />
              ) : (
                <ArrowRight className="w-4 h-4 text-cream" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
