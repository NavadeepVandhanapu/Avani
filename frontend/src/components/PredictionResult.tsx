import React, { useState } from 'react';
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
  Globe,
  Mic,
  Layers,
  Eye,
  ThumbsUp,
  ThumbsDown,
  Camera,
  Target,
  Sparkles
} from 'lucide-react';
import type { Language, PredictionResponse } from '../types';
import { TRANSLATIONS } from '../translations';
import { SpeechAssistant } from '../utils/speech';
import { submitFarmerFeedback } from '../services/api';

interface PredictionResultProps {
  currentLang: Language;
  onLanguageChange?: (lang: Language) => void;
  prediction: PredictionResponse;
  previewUrl: string;
  onProceedToQuestions: () => void;
  onScanAnother: () => void;
  onOpenVoiceAssistant?: () => void;
  onScanWithCamera?: () => void;
}

export const PredictionResult: React.FC<PredictionResultProps> = ({
  currentLang,
  onLanguageChange,
  prediction,
  previewUrl,
  onProceedToQuestions,
  onScanAnother,
  onOpenVoiceAssistant,
  onScanWithCamera
}) => {
  const t = TRANSLATIONS[currentLang];

  const [activeView, setActiveView] = useState<'annotated' | 'hsv' | 'original'>(
    prediction.hsv_segmentation?.annotated_mask_url ? 'annotated' : 'original'
  );
  const [selectedPinId, setSelectedPinId] = useState<string | null>(null);
  const [hoveredPinId, setHoveredPinId] = useState<string | null>(null);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState<string | null>(null);

  const isInvalid = !prediction.is_leaf_detected || prediction.predicted_class === 'Invalid___Non_Leaf';
  const isUncertain = Boolean(prediction.is_uncertain && !isInvalid);
  const isHealthy = Boolean(prediction.is_healthy && !isUncertain && !isInvalid);
  const hsv = prediction.hsv_segmentation;

  const handleReadResult = () => {
    let speechText = '';
    if (isInvalid) {
      speechText = t.non_leaf_warning;
    } else if (isUncertain) {
      speechText = `${t.uncertain_warning_title}. ${prediction.plain_explanation}`;
    } else if (isHealthy) {
      speechText = `${prediction.crop}. ${t.healthy_status_badge}. ${t.healthy_explanation_default}`;
    } else {
      speechText = `${prediction.crop}. ${prediction.condition}. ${prediction.plain_explanation}. ${t.confidence_question}: ${prediction.plain_confidence}.`;
    }
    SpeechAssistant.speak(speechText, currentLang);
  };

  const handleSendFeedback = async (rating: 'accurate' | 'partial' | 'incorrect') => {
    setFeedbackSubmitted(rating);
    await submitFarmerFeedback({
      predicted_class: prediction.predicted_class,
      rating,
      is_accurate: rating === 'accurate',
      actual_condition: prediction.condition,
      notes: `Farmer feedback rating: ${rating}`
    });
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

            <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                type="button"
                onClick={onScanWithCamera || onScanAnother}
                className="w-full sm:w-auto px-6 py-3.5 rounded-natural bg-primary hover:bg-primary-dark text-cream font-bold text-sm shadow-subtle inline-flex items-center justify-center space-x-2 cursor-pointer transition-all active:scale-95"
                id="invalid-camera-scan-btn"
              >
                <Camera className="w-5 h-5 text-cream" />
                <span>{t.scan_real_camera || "Turn ON Camera (Scan Real Life Leaf)"}</span>
              </button>

              <button
                type="button"
                onClick={onScanAnother}
                className="w-full sm:w-auto px-5 py-3.5 rounded-natural bg-ivory hover:bg-ivory-dark text-charcoal font-medium text-sm border border-warmborder inline-flex items-center justify-center space-x-2 cursor-pointer transition-colors"
              >
                <RotateCcw className="w-4 h-4 text-muted" />
                <span>{t.scan_another_action}</span>
              </button>
            </div>
          </div>
        ) : (
          <div>
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 pb-6 border-b border-warmborder">
              {/* Photo & HSV Display Box with Mode Switcher & Interactive Hotspot Callouts */}
              <div className="flex flex-col items-center flex-shrink-0">
                <div className="w-48 h-48 sm:w-56 sm:h-56 rounded-2xl overflow-hidden border-2 border-warmborder bg-ivory shadow-subtle relative select-none">
                  <img
                    src={
                      activeView === 'annotated' && hsv?.annotated_mask_url
                        ? hsv.annotated_mask_url
                        : activeView === 'hsv' && hsv?.segmentation_mask_url
                        ? hsv.segmentation_mask_url
                        : previewUrl
                    }
                    alt={
                      activeView === 'annotated'
                        ? 'Leaf with Marked Hotspots'
                        : activeView === 'hsv'
                        ? 'HSV Color Segmentation'
                        : 'Scanned Leaf'
                    }
                    className="w-full h-full object-cover transition-all"
                  />

                  {/* Mode Watermark Tag */}
                  <span className="absolute bottom-2 left-2 bg-charcoal/85 text-cream text-[10px] font-bold px-2 py-0.5 rounded-md backdrop-blur-sm shadow-xs flex items-center space-x-1">
                    {activeView === 'annotated' && (
                      <>
                        <Target className="w-3 h-3 text-ochre" />
                        <span>{t.hsv_tab_annotated || 'Pointed Pins'}</span>
                      </>
                    )}
                    {activeView === 'hsv' && (
                      <>
                        <Layers className="w-3 h-3 text-secondary" />
                        <span>{t.hsv_tab_heatmap || 'HSV Heatmap'}</span>
                      </>
                    )}
                    {activeView === 'original' && (
                      <>
                        <Eye className="w-3 h-3 text-cream" />
                        <span>{t.hsv_tab_original || 'Original'}</span>
                      </>
                    )}
                  </span>

                  {/* Interactive Hotspot Pins overlay over Leaf Image */}
                  {activeView === 'annotated' && hsv?.hotspots && hsv.hotspots.map((pin, idx) => {
                    const isSelected = selectedPinId === pin.id;
                    const isHovered = hoveredPinId === pin.id;
                    const isActive = isSelected || isHovered;

                    const label = currentLang === 'te' && pin.telugu_label
                      ? pin.telugu_label
                      : currentLang === 'hi' && pin.hindi_label
                      ? pin.hindi_label
                      : pin.label;

                    const desc = currentLang === 'te' && pin.telugu_desc
                      ? pin.telugu_desc
                      : currentLang === 'hi' && pin.hindi_desc
                      ? pin.hindi_desc
                      : pin.description;

                    return (
                      <div
                        key={pin.id || idx}
                        style={{ left: `${pin.x}%`, top: `${pin.y}%` }}
                        className="absolute -translate-x-1/2 -translate-y-1/2 z-20 cursor-pointer group"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedPinId(isSelected ? null : pin.id);
                        }}
                        onMouseEnter={() => setHoveredPinId(pin.id)}
                        onMouseLeave={() => setHoveredPinId(null)}
                      >
                        {/* Radar Pulse Effect */}
                        <span
                          style={{ borderColor: pin.color }}
                          className={`absolute -inset-2.5 rounded-full border-2 animate-ping opacity-75 pointer-events-none ${
                            isActive ? 'scale-125' : ''
                          }`}
                        />

                        {/* Pin Center Marker */}
                        <div
                          style={{ backgroundColor: pin.color }}
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black text-white shadow-lg transition-transform duration-200 border-2 border-white ${
                            isActive ? 'scale-125 ring-2 ring-primary ring-offset-1' : 'hover:scale-110'
                          }`}
                        >
                          {idx + 1}
                        </div>

                        {/* Interactive Tooltip Card */}
                        <div
                          className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 sm:w-56 p-2.5 rounded-xl bg-charcoal/95 backdrop-blur-md text-white shadow-xl transition-all duration-200 text-left z-30 pointer-events-none ${
                            isActive ? 'opacity-100 visible scale-100 -translate-y-1' : 'opacity-0 invisible scale-95'
                          }`}
                        >
                          <div className="flex items-center justify-between pb-1 mb-1 border-b border-white/20">
                            <div className="flex items-center space-x-1.5 font-bold text-xs">
                              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: pin.color }} />
                              <span className="truncate">#{idx + 1} {label}</span>
                            </div>
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/20 font-medium">
                              {pin.severity}
                            </span>
                          </div>
                          <p className="text-[10px] text-cream/90 leading-tight">
                            {desc}
                          </p>
                          {pin.pigment && (
                            <div className="mt-1 text-[9px] text-ochre font-medium">
                              Pigment: {pin.pigment}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* View Mode Switcher: Pointed Pins | HSV Heatmap | Original */}
                {hsv && (
                  <div className="mt-2.5 flex items-center bg-ivory border border-warmborder rounded-xl p-1 shadow-subtle text-[11px] font-medium gap-1">
                    {hsv.annotated_mask_url && (
                      <button
                        type="button"
                        onClick={() => setActiveView('annotated')}
                        className={`px-2.5 py-1.5 rounded-lg transition-all cursor-pointer flex items-center space-x-1.5 ${
                          activeView === 'annotated'
                            ? 'bg-primary text-cream font-bold shadow-xs'
                            : 'text-charcoal hover:bg-cream'
                        }`}
                        title="Pointed Pins & Pigmentation Markers"
                      >
                        <Target className="w-3.5 h-3.5 text-ochre" />
                        <span>{t.hsv_tab_annotated || 'Pointed Pins'}</span>
                      </button>
                    )}
                    {hsv.segmentation_mask_url && (
                      <button
                        type="button"
                        onClick={() => setActiveView('hsv')}
                        className={`px-2.5 py-1.5 rounded-lg transition-all cursor-pointer flex items-center space-x-1.5 ${
                          activeView === 'hsv'
                            ? 'bg-secondary text-cream font-bold shadow-xs'
                            : 'text-charcoal hover:bg-cream'
                        }`}
                        title="HSV False-Color Heatmap"
                      >
                        <Layers className="w-3.5 h-3.5" />
                        <span>{t.hsv_tab_heatmap || 'HSV Heatmap'}</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setActiveView('original')}
                      className={`px-2.5 py-1.5 rounded-lg transition-all cursor-pointer flex items-center space-x-1.5 ${
                        activeView === 'original'
                          ? 'bg-charcoal text-cream font-bold shadow-xs'
                          : 'text-charcoal hover:bg-cream'
                      }`}
                      title="Original Leaf Photo"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>{t.hsv_tab_original || 'Original'}</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Finding Text */}
              <div className="flex-1 text-center sm:text-left">
                
                {/* Status Indicator Badge */}
                <div className="mb-2.5">
                  {isUncertain ? (
                    <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-alert-light text-alert border border-alert/30 shadow-subtle">
                      <HelpCircle className="w-3.5 h-3.5 text-alert" />
                      <span>{t.uncertain_status_badge}</span>
                    </span>
                  ) : isHealthy ? (
                    <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-secondary/15 text-primary border border-secondary/30 shadow-subtle">
                      <CheckCircle2 className="w-3.5 h-3.5 text-secondary" />
                      <span>{t.healthy_status_badge}</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-danger-light text-danger border border-danger/30 shadow-subtle">
                      <ShieldAlert className="w-3.5 h-3.5 text-danger" />
                      <span>{t.disease_status_badge}</span>
                    </span>
                  )}
                </div>

                {/* Primary Common Crop & Condition Name (or Inconclusive Observation when uncertain) */}
                <h3 className="text-xl sm:text-2xl font-bold text-primary font-sans">
                  {isUncertain ? t.uncertain_primary_heading : `${prediction.crop} — ${prediction.condition}`}
                </h3>

                {/* Tentative Possibility Banner when Uncertain */}
                {isUncertain && (
                  <div className="mt-2 p-2.5 rounded-lg bg-ivory border border-warmborder text-xs">
                    <span className="font-bold text-charcoal">{t.tentative_resemblance_label}: </span>
                    <span className="text-primary font-semibold">{prediction.crop} — {prediction.condition}</span>
                    <span className="text-muted ml-1.5 font-normal">{t.low_certainty_note || "(Low certainty observation)"}</span>
                  </div>
                )}
                
                {/* Scientific Name as Subtle Secondary Info (only for confirmed diagnosis) */}
                {!isUncertain && prediction.scientific_name && (
                  <p className="text-[11px] text-muted mt-0.5">
                    <span className="font-medium">{t.scientific_name_label}:</span> <span className="italic">{prediction.scientific_name}</span>
                  </p>
                )}

                {/* Plain-Language Explanation */}
                <p className="text-xs sm:text-sm text-charcoal mt-2.5 leading-relaxed">
                  {isUncertain ? prediction.plain_explanation : isHealthy ? t.healthy_explanation_default : prediction.plain_explanation}
                </p>

                {/* "How sure is this result?" Genuine Model Confidence */}
                <div className="mt-3.5 pt-2.5 border-t border-warmborder/60 flex flex-wrap items-center justify-center sm:justify-start gap-2 text-xs">
                  <span className="font-semibold text-charcoal">{t.confidence_question}</span>
                  <span className="px-2.5 py-1 rounded bg-ivory border border-warmborder text-secondary-dark font-medium">
                    {prediction.plain_confidence}
                  </span>
                </div>

              </div>

            </div>

            {/* HSV Color-Space Quantitative Segmentation & Marked Hotspots Panel */}
            {hsv && (
              <div className="mt-5 p-4 rounded-2xl bg-gradient-to-br from-ivory to-cream border border-warmborder shadow-subtle">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-warmborder/70 gap-1.5">
                  <div className="flex items-center space-x-2">
                    <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                      <Layers className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-charcoal">
                        {t.hsv_panel_title || "HSV Spectral Pigmentation & Marked Hotspots"}
                      </h4>
                      <p className="text-[11px] text-muted">
                        {t.hsv_panel_subtitle || "Visual proof of color differences (chlorosis vs necrosis) analyzed on the leaf"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1.5 self-start sm:self-auto">
                    <span className="inline-flex items-center space-x-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-secondary/15 text-primary border border-secondary/20">
                      <Sparkles className="w-3 h-3 text-secondary" />
                      <span>{t.hsv_tab_annotated || "Pointed Pins"} Active</span>
                    </span>
                  </div>
                </div>

                {/* 3 Metric Gauges */}
                <div className="grid grid-cols-3 gap-2.5 my-3 text-center">
                  <div className="p-2.5 rounded-xl bg-ivory border border-warmborder shadow-xs">
                    <span className="text-[10px] text-muted block font-medium">Healthy Chlorophyll</span>
                    <span className="text-sm sm:text-base font-extrabold text-secondary-dark">
                      {hsv.healthy_percentage}%
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-ivory border border-warmborder shadow-xs">
                    <span className="text-[10px] text-muted block font-medium">Lesion / Necrosis</span>
                    <span className={`text-sm sm:text-base font-extrabold ${hsv.lesion_percentage > 15 ? 'text-danger' : 'text-ochre'}`}>
                      {hsv.lesion_percentage}%
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-ivory border border-warmborder shadow-xs">
                    <span className="text-[10px] text-muted block font-medium">Leaf Coverage</span>
                    <span className="text-sm sm:text-base font-extrabold text-charcoal">
                      {hsv.leaf_coverage_ratio}%
                    </span>
                  </div>
                </div>

                {/* Interactive Hotspots Card Grid */}
                {hsv.hotspots && hsv.hotspots.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-warmborder/70">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-1.5 text-xs font-bold text-charcoal">
                        <Target className="w-3.5 h-3.5 text-ochre" />
                        <span>{t.hsv_hotspots_heading || "Pointed Findings on Leaf Surface"}</span>
                      </div>
                      <span className="text-[10px] text-muted italic">
                        {t.hsv_tap_pin_hint || "Tap any pin or card to inspect"}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {hsv.hotspots.map((pin, idx) => {
                        const isSelected = selectedPinId === pin.id;
                        const isHovered = hoveredPinId === pin.id;
                        const isActive = isSelected || isHovered;

                        const label = currentLang === 'te' && pin.telugu_label
                          ? pin.telugu_label
                          : currentLang === 'hi' && pin.hindi_label
                          ? pin.hindi_label
                          : pin.label;

                        const desc = currentLang === 'te' && pin.telugu_desc
                          ? pin.telugu_desc
                          : currentLang === 'hi' && pin.hindi_desc
                          ? pin.hindi_desc
                          : pin.description;

                        return (
                          <div
                            key={pin.id || idx}
                            onClick={() => {
                              setSelectedPinId(isSelected ? null : pin.id);
                              setActiveView('annotated');
                            }}
                            onMouseEnter={() => setHoveredPinId(pin.id)}
                            onMouseLeave={() => setHoveredPinId(null)}
                            className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-start space-x-2.5 text-left ${
                              isActive
                                ? 'bg-white border-primary shadow-md ring-2 ring-primary/20 scale-[1.01]'
                                : 'bg-ivory/90 hover:bg-white border-warmborder'
                            }`}
                          >
                            {/* Pin Index & Color Pill */}
                            <div
                              style={{ backgroundColor: pin.color }}
                              className="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] font-bold text-white shadow-xs mt-0.5"
                            >
                              {idx + 1}
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-1 mb-0.5">
                                <span className="text-xs font-bold text-charcoal truncate">
                                  {label}
                                </span>
                                <span className={`text-[9px] px-1.5 py-0.5 rounded font-semibold flex-shrink-0 ${
                                  pin.severity === 'High' 
                                    ? 'bg-danger-light text-danger' 
                                    : pin.severity === 'Moderate' 
                                    ? 'bg-alert-light text-alert' 
                                    : 'bg-secondary/15 text-primary'
                                }`}>
                                  {pin.severity}
                                </span>
                              </div>
                              <p className="text-[11px] text-charcoal-muted leading-relaxed line-clamp-2">
                                {desc}
                              </p>
                              {pin.pigment && (
                                <span className="inline-block mt-1 text-[10px] text-primary font-medium">
                                  • {pin.pigment}
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Observable Damage / What to look for Signs Box */}
            {prediction.visible_symptoms_reference && prediction.visible_symptoms_reference.length > 0 && (
              <div className="mt-4 p-4 rounded-natural bg-ivory/70 border border-warmborder/80">
                <h4 className="text-xs sm:text-sm font-bold text-charcoal flex items-center space-x-1.5 mb-2.5">
                  <Leaf className="w-4 h-4 text-secondary" />
                  <span>{isUncertain ? t.observable_damage_heading : t.what_to_look_for}:</span>
                </h4>
                <ul className="space-y-1.5 text-xs text-charcoal-muted">
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

            {/* Adaptive Feedback Card (Slide 5: Adaptive Model Feedback) */}
            <div className="mt-4 p-3.5 rounded-xl bg-ivory border border-warmborder flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <div className="text-center sm:text-left">
                <span className="font-bold text-charcoal block">
                  🌾 Farmer Field Verification (Adaptive Model Feedback):
                </span>
                <span className="text-[11px] text-muted">
                  Does this symptom match what you observe on your plants?
                </span>
              </div>

              {feedbackSubmitted ? (
                <span className="px-3 py-1 rounded-full bg-secondary/20 text-primary-dark font-bold text-xs animate-fadeIn">
                  ✓ Feedback Recorded — Model Calibrated
                </span>
              ) : (
                <div className="flex items-center space-x-1.5">
                  <button
                    type="button"
                    onClick={() => handleSendFeedback('accurate')}
                    className="px-2.5 py-1.5 rounded-lg border border-warmborder bg-cream hover:bg-secondary/15 text-charcoal text-[11px] font-semibold flex items-center space-x-1 cursor-pointer transition-colors"
                  >
                    <ThumbsUp className="w-3 h-3 text-secondary" />
                    <span>Accurate</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSendFeedback('partial')}
                    className="px-2.5 py-1.5 rounded-lg border border-warmborder bg-cream hover:bg-ochre/15 text-charcoal text-[11px] font-semibold flex items-center space-x-1 cursor-pointer transition-colors"
                  >
                    <span>Partially</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSendFeedback('incorrect')}
                    className="px-2.5 py-1.5 rounded-lg border border-warmborder bg-cream hover:bg-danger/15 text-charcoal text-[11px] font-semibold flex items-center space-x-1 cursor-pointer transition-colors"
                  >
                    <ThumbsDown className="w-3 h-3 text-danger" />
                    <span>Different</span>
                  </button>
                </div>
              )}
            </div>

            {/* Respectful Farmer Disclaimer */}
            <div className="mt-4 p-3 rounded-lg bg-ivory/40 border border-warmborder/60 text-[11px] text-muted leading-relaxed">
              {t.preliminary_notice_simple}
            </div>

            {/* Real Life Field Camera Banner (After-Scan Live Camera Feature) */}
            <div className="mt-5 p-4 rounded-xl bg-gradient-to-r from-secondary/15 via-primary/5 to-cream border border-secondary/35 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-subtle">
              <div className="flex items-center space-x-3 text-center sm:text-left">
                <div className="w-10 h-10 rounded-xl bg-primary text-cream flex items-center justify-center flex-shrink-0 shadow-subtle">
                  <Camera className="w-5 h-5 text-cream" />
                </div>
                <div>
                  <span className="font-bold text-primary block text-xs sm:text-sm">
                    📷 {t.scan_real_camera || "Scan a Real-Life Leaf (Turn ON Camera)"}
                  </span>
                  <span className="text-[11px] text-muted">
                    {t.scan_real_camera_sub || "Scan directly on your living plant in the field using your device camera"}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={onScanWithCamera || onScanAnother}
                className="w-full sm:w-auto px-4 py-2.5 rounded-lg bg-primary hover:bg-primary-dark active:scale-95 text-cream font-bold text-xs shadow-subtle flex items-center justify-center space-x-2 transition-all cursor-pointer whitespace-nowrap"
                id="after-scan-live-camera-cta"
              >
                <Camera className="w-4 h-4 text-cream" />
                <span>{t.turn_on_camera || "Turn ON Camera Now"}</span>
              </button>
            </div>

            {/* Obvious Next Actions */}
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-warmborder">
              
              <div className="flex items-center space-x-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={onScanWithCamera || onScanAnother}
                  className="flex-1 sm:flex-none px-4 py-3 rounded-natural bg-secondary/15 hover:bg-secondary/25 border border-secondary/40 text-primary-dark font-bold text-xs sm:text-sm shadow-subtle flex items-center justify-center space-x-2 transition-all cursor-pointer"
                  id="after-scan-camera-btn"
                  title="Turn on live camera to capture a real plant leaf in field"
                >
                  <Camera className="w-4 h-4 text-secondary-dark" />
                  <span>{t.scan_real_camera || "Scan Real Leaf (Camera)"}</span>
                </button>

                <button
                  type="button"
                  onClick={onScanAnother}
                  className="flex-1 sm:flex-none px-3.5 py-3 rounded-natural bg-ivory hover:bg-ivory-dark text-charcoal font-medium text-xs sm:text-sm border border-warmborder transition-colors flex items-center justify-center space-x-1.5 cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4 text-muted" />
                  <span>{t.scan_another_action}</span>
                </button>

                {onOpenVoiceAssistant && (
                  <button
                    onClick={onOpenVoiceAssistant}
                    className="flex-1 sm:flex-initial px-4 py-3 rounded-natural bg-secondary/15 hover:bg-secondary/25 text-secondary-dark font-medium text-xs sm:text-sm border border-secondary/30 transition-colors flex items-center justify-center space-x-2 cursor-pointer shadow-subtle"
                    title={t.voice_assistant_btn || "Voice Assistant"}
                  >
                    <Mic className="w-4 h-4 text-secondary-dark" />
                    <span>{t.voice_assistant_btn || "Voice Assistant"}</span>
                  </button>
                )}
              </div>

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
