import React from 'react';
import { 
  CheckCircle2, 
  AlertTriangle, 
  HelpCircle, 
  ArrowRight, 
  RotateCcw, 
  Volume2, 
  Info, 
  Leaf, 
  ShieldAlert,
  Globe
} from 'lucide-react';
import type { Language, PredictionResponse } from '../types';
import { TRANSLATIONS } from '../translations';
import { SpeechAssistant } from '../utils/speech';

interface PredictionResultProps {
  currentLang: Language;
  onLanguageChange?: (lang: Language) => void;
  prediction: PredictionResponse;
  previewUrl: string;
  onProceedToQuestions: () => void;
  onScanAnother: () => void;
}

export const PredictionResult: React.FC<PredictionResultProps> = ({
  currentLang,
  onLanguageChange,
  prediction,
  previewUrl,
  onProceedToQuestions,
  onScanAnother
}) => {
  const t = TRANSLATIONS[currentLang];

  const isInvalid = !prediction.is_leaf_detected || prediction.predicted_class === 'Invalid___Non_Leaf';
  const isHealthy = prediction.is_healthy;
  const isUncertain = prediction.is_uncertain && !isInvalid;

  const handleReadResult = () => {
    let speechText = '';
    if (isInvalid) {
      speechText = t.non_leaf_warning;
    } else if (isHealthy) {
      speechText = `${prediction.crop}. ${t.healthy_status_badge}. ${t.healthy_explanation_default}`;
    } else {
      speechText = `${prediction.crop}. ${prediction.condition}. ${prediction.plain_explanation}. ${t.confidence_question}: ${prediction.plain_confidence}.`;
    }
    SpeechAssistant.speak(speechText, currentLang);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      
      {/* Top Header with Language Selector & Audio */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2.5">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-primary font-sans">
            {t.result_heading}
          </h2>
        </div>

        <div className="flex items-center space-x-2">
          {/* Audio read-aloud button */}
          <button
            onClick={handleReadResult}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-warmborder bg-cream hover:bg-ivory text-xs font-medium text-charcoal shadow-subtle cursor-pointer"
            title={t.btn_listen_tts}
          >
            <Volume2 className="w-3.5 h-3.5 text-primary" />
            <span>{t.btn_listen_tts}</span>
          </button>

          {/* Inline Language Selector */}
          {onLanguageChange && (
            <div className="flex items-center space-x-1 bg-cream border border-warmborder rounded-lg p-0.5 shadow-subtle">
              <Globe className="w-3 h-3 text-muted ml-1.5 mr-0.5" />
              {(['en', 'te', 'hi'] as Language[]).map((lang) => (
                <button
                  key={lang}
                  type="button"
                  onClick={() => onLanguageChange(lang)}
                  className={`px-2 py-1 rounded text-[11px] font-semibold transition-all cursor-pointer ${
                    currentLang === lang
                      ? 'bg-primary text-cream'
                      : 'text-charcoal hover:bg-ivory'
                  }`}
                >
                  {lang === 'en' ? 'EN' : lang === 'te' ? 'తెలుగు' : 'हिन्दी'}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main Result Card */}
      <div className="bg-cream border border-warmborder rounded-card p-5 sm:p-7 shadow-card">
        
        {/* Invalid / Non-Leaf Case */}
        {isInvalid ? (
          <div className="text-center py-6">
            <div className="w-14 h-14 rounded-2xl bg-danger-light text-danger mx-auto flex items-center justify-center mb-3">
              <AlertTriangle className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-bold text-charcoal">
              {t.non_leaf_warning}
            </h3>
            <p className="text-xs sm:text-sm text-muted mt-2 max-w-md mx-auto leading-relaxed">
              {prediction.plain_explanation || "We could not find plant leaf features in this photo. Please hold a real crop leaf steady in good light and scan again."}
            </p>

            <div className="mt-6">
              <button
                onClick={onScanAnother}
                className="px-6 py-3.5 rounded-natural bg-primary hover:bg-primary-dark text-cream font-semibold text-sm shadow-subtle inline-flex items-center space-x-2 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>{t.scan_another_action}</span>
              </button>
            </div>
          </div>
        ) : (
          <div>
            {/* Top Layout: Photo Thumbnail + Finding */}
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 pb-6 border-b border-warmborder">
              
              {/* Leaf Photo Thumbnail */}
              <div className="w-32 h-32 sm:w-36 sm:h-36 rounded-2xl overflow-hidden border border-warmborder bg-ivory flex-shrink-0 shadow-subtle">
                <img
                  src={previewUrl}
                  alt="Scanned Leaf"
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Finding Text */}
              <div className="flex-1 text-center sm:text-left">
                
                {/* Status Indicator Badge */}
                <div className="mb-2.5">
                  {isHealthy ? (
                    <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-secondary/15 text-primary border border-secondary/30 shadow-subtle">
                      <CheckCircle2 className="w-3.5 h-3.5 text-secondary" />
                      <span>{t.healthy_status_badge}</span>
                    </span>
                  ) : isUncertain ? (
                    <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-alert-light text-alert border border-alert/30 shadow-subtle">
                      <HelpCircle className="w-3.5 h-3.5 text-alert" />
                      <span>{t.uncertain_status_badge}</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-danger-light text-danger border border-danger/30 shadow-subtle">
                      <ShieldAlert className="w-3.5 h-3.5 text-danger" />
                      <span>{t.disease_status_badge}</span>
                    </span>
                  )}
                </div>

                {/* Primary Common Crop & Condition Name */}
                <h3 className="text-xl sm:text-2xl font-bold text-primary font-sans">
                  {prediction.crop} — {prediction.condition}
                </h3>
                
                {/* Scientific Name as Subtle Secondary Info */}
                {prediction.scientific_name && (
                  <p className="text-[11px] text-muted mt-0.5">
                    <span className="font-medium">{t.scientific_name_label}:</span> <span className="italic">{prediction.scientific_name}</span>
                  </p>
                )}

                {/* Plain-Language Explanation */}
                <p className="text-xs sm:text-sm text-charcoal mt-2.5 leading-relaxed">
                  {isHealthy ? t.healthy_explanation_default : prediction.plain_explanation}
                </p>

                {/* "How sure is this result?" Genuine Model Confidence */}
                <div className="mt-3.5 pt-2.5 border-t border-warmborder/60 flex flex-wrap items-center justify-center sm:justify-start gap-2 text-xs">
                  <span className="font-semibold text-charcoal">{t.confidence_question}</span>
                  <span className="px-2.5 py-1 rounded bg-ivory border border-warmborder text-secondary-dark font-medium">
                    {prediction.plain_confidence} ({Math.round(prediction.confidence * 100)}%)
                  </span>
                </div>

              </div>

            </div>

            {/* "What to look for" Signs Box */}
            {prediction.visible_symptoms_reference && prediction.visible_symptoms_reference.length > 0 && (
              <div className="mt-5 p-4 rounded-natural bg-ivory/70 border border-warmborder/80">
                <h4 className="text-xs sm:text-sm font-bold text-charcoal flex items-center space-x-1.5 mb-2.5">
                  <Leaf className="w-4 h-4 text-secondary" />
                  <span>{t.what_to_look_for}:</span>
                </h4>
                <ul className="space-y-2 text-xs text-charcoal-muted">
                  {prediction.visible_symptoms_reference.map((sign, idx) => (
                    <li key={idx} className="flex items-start space-x-2">
                      <span className="text-primary font-bold mt-0.5">•</span>
                      <span className="leading-relaxed">{sign}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Unclear Warning Message */}
            {isUncertain && (
              <div className="mt-4 p-3.5 rounded-natural bg-alert-light border border-alert/20 text-alert text-xs flex items-start space-x-2">
                <Info className="w-4 h-4 mt-0.5 flex-shrink-0 text-alert" />
                <div>
                  <span className="font-bold">{t.uncertain_warning_title}: </span>
                  <span>{t.uncertain_warning_text}</span>
                </div>
              </div>
            )}

            {/* Respectful Farmer Disclaimer */}
            <div className="mt-4 p-3 rounded-lg bg-ivory/40 border border-warmborder/60 text-[11px] text-muted leading-relaxed">
              {t.preliminary_notice_simple}
            </div>

            {/* Obvious Next Actions */}
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-warmborder">
              
              <button
                onClick={onScanAnother}
                className="w-full sm:w-auto px-5 py-3 rounded-natural bg-ivory hover:bg-ivory-dark text-charcoal font-medium text-xs sm:text-sm border border-warmborder transition-colors flex items-center justify-center space-x-2 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4 text-muted" />
                <span>{t.scan_another_action}</span>
              </button>

              <button
                onClick={onProceedToQuestions}
                className="w-full sm:w-auto px-8 py-4 rounded-natural bg-primary hover:bg-primary-dark text-cream font-bold text-sm sm:text-base shadow-elevated transition-all flex items-center justify-center space-x-2 active:scale-[0.99] cursor-pointer"
                id="tell-us-about-crop-btn"
              >
                <span>{t.tell_us_about_crop}</span>
                <ArrowRight className="w-4 h-4 text-cream" />
              </button>

            </div>

          </div>
        )}

      </div>

    </div>
  );
};
