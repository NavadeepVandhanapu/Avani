import React, { useState, useEffect, useRef } from 'react';
import { 
  Mic, 
  MicOff, 
  X, 
  Volume2, 
  Square, 
  RotateCcw, 
  Send, 
  AlertCircle, 
  Sparkles, 
  Leaf, 
  Info
} from 'lucide-react';
import type { Language, PredictionResponse } from '../types';
import { TRANSLATIONS } from '../translations';
import { SpeechAssistant } from '../utils/speech';
import { fetchVoiceQueryAnswer } from '../services/api';

interface VoiceAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLang: Language;
  onLanguageChange?: (lang: Language) => void;
  currentScan?: PredictionResponse | null;
}

type VoiceState = 'idle' | 'listening' | 'processing' | 'speaking' | 'error';

export const VoiceAssistantModal: React.FC<VoiceAssistantModalProps> = ({
  isOpen,
  onClose,
  currentLang,
  onLanguageChange,
  currentScan
}) => {
  const t = TRANSLATIONS[currentLang];

  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const [transcript, setTranscript] = useState('');
  const [interimText, setInterimText] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [voiceUnavailableWarning, setVoiceUnavailableWarning] = useState<string | null>(null);
  
  const [responseAnswer, setResponseAnswer] = useState<string | null>(null);
  const [responsePointers, setResponsePointers] = useState<string[]>([]);
  const [matchedCrop, setMatchedCrop] = useState<string | null>(null);
  const [isSpeakingResponse, setIsSpeakingResponse] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Check speech recognition support
  const isRecognitionSupported = SpeechAssistant.isRecognitionSupported();

  useEffect(() => {
    if (!isOpen) {
      handleStopAll();
    } else {
      setErrorMessage(null);
      setVoiceUnavailableWarning(null);
    }
  }, [isOpen, currentLang]);

  const handleStopAll = () => {
    SpeechAssistant.stop();
    setVoiceState('idle');
    setIsSpeakingResponse(false);
  };

  const handleToggleListening = async () => {
    if (voiceState === 'listening') {
      SpeechAssistant.stopListening();
      setVoiceState('idle');
      return;
    }

    // Stop speaking if was active
    SpeechAssistant.stop();
    setIsSpeakingResponse(false);
    setErrorMessage(null);
    setVoiceUnavailableWarning(null);

    const started = await SpeechAssistant.startListening(currentLang, {
      onStart: () => {
        setVoiceState('listening');
        setInterimText('');
      },
      onResult: (text: string, isFinal: boolean) => {
        if (isFinal) {
          setTranscript(prev => (prev ? `${prev} ${text}` : text).trim());
          setInterimText('');
        } else {
          setInterimText(text);
        }
      },
      onError: (msg: string, code?: string) => {
        setVoiceState('error');
        if (code === 'not-allowed' || code === 'permission-denied') {
          setErrorMessage(t.voice_permission_denied || "Microphone access was denied. Please allow microphone permission in your browser.");
        } else if (code === 'no-speech') {
          setErrorMessage(t.voice_no_speech || "No speech heard. Please tap the microphone and speak near your device.");
        } else {
          setErrorMessage(msg);
        }
      },
      onEnd: () => {
        setVoiceState('idle');
      }
    });

    if (!started && !isRecognitionSupported) {
      setErrorMessage(t.voice_unsupported || "Speech recognition is not supported in this browser. You can type your question directly below.");
    }
  };

  /** Detect language from Unicode script characters in the query text */
  const detectInputLanguage = (text: string): Language => {
    let teluguCount = 0;
    let hindiCount = 0;
    for (const ch of text) {
      const code = ch.charCodeAt(0);
      if (code >= 0x0C00 && code <= 0x0C7F) teluguCount++;
      if (code >= 0x0900 && code <= 0x097F) hindiCount++;
    }
    if (teluguCount >= 3) return 'te';
    if (hindiCount >= 3) return 'hi';
    return currentLang; // fallback to app language
  };

  const handleSubmitQuery = async (queryText?: string) => {
    const queryToSend = (queryText || transcript).trim();
    if (!queryToSend) return;

    // Auto-detect input language from query text
    const detectedLang = detectInputLanguage(queryToSend);

    // Stop listening or speaking
    SpeechAssistant.stop();
    setVoiceState('processing');
    setErrorMessage(null);
    setVoiceUnavailableWarning(null);

    try {
      const scanContext = currentScan ? {
        crop: currentScan.crop,
        condition: currentScan.condition,
        predicted_class: currentScan.predicted_class,
        is_healthy: currentScan.is_healthy,
        confidence: currentScan.confidence
      } : null;

      const res = await fetchVoiceQueryAnswer(queryToSend, detectedLang, scanContext);
      
      setResponseAnswer(res.answer_text);
      setResponsePointers(res.action_pointers || []);
      setMatchedCrop(res.matched_crop || null);
      setVoiceState('idle');

      // Speak response in the detected language
      playResponseAudio(res.answer_text, detectedLang);
    } catch (err: any) {
      setVoiceState('error');
      setErrorMessage("Could not retrieve answer. Please check backend connectivity.");
    }
  };

  const playResponseAudio = (text: string, lang?: Language) => {
    const spokenLang = lang || currentLang;
    setVoiceUnavailableWarning(null);
    setIsSpeakingResponse(true);
    setVoiceState('speaking');

    SpeechAssistant.speak(
      text,
      spokenLang,
      () => {
        setIsSpeakingResponse(false);
        setVoiceState('idle');
      },
      () => {
        // Voice unavailable callback
        setVoiceUnavailableWarning(
          spokenLang === 'te' 
            ? "తెలుగు వాయిస్ మీ పరికరంలో అందుబాటులో లేదు. సమాధానం క్రింద టెక్స్ట్‌లో చదవవచ్చు." 
            : spokenLang === 'hi'
            ? "हिन्दी वॉइस आपके डिवाइस पर उपलब्ध नहीं है। उत्तर नीचे टेक्स्ट में पढ़ सकते हैं।"
            : "Voice not available for this language on your browser."
        );
      }
    );
  };

  const handleStopSpeaking = () => {
    SpeechAssistant.stop();
    setIsSpeakingResponse(false);
    setVoiceState('idle');
  };

  const handleQuickPrompt = (promptText: string) => {
    setTranscript(promptText);
    handleSubmitQuery(promptText);
  };

  if (!isOpen) return null;

  // Sample quick queries based on language
  const samplePrompts = currentLang === 'te' ? [
    "ఆకులపై మచ్చలు వస్తే ఏం చేయాలి?",
    "పంటకు నీరు ఎలా పారించాలి?",
    "వర్షం తర్వాత తెగులు ఎలా అరికట్టాలి?"
  ] : currentLang === 'hi' ? [
    "पत्तियों पर पीले धब्बे हों तो क्या करें?",
    "फसल में सिंचाई कब और कैसे करें?",
    "कीटनाशक छिड़काव की सही सलाह क्या है?"
  ] : [
    "What to check for dark leaf spots?",
    "Best watering practice to prevent mold?",
    "When should I contact the agricultural officer?"
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto animate-fade-in">
      <div className="bg-cream border border-warmborder rounded-card w-full max-w-2xl shadow-elevated overflow-hidden my-6">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-warmborder bg-ivory/60 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Mic className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-primary font-sans">
                {t.voice_modal_title || "Avani Two-Way Voice Assistant"}
              </h3>
              <p className="text-[11px] text-muted">
                {t.voice_modal_subtitle || "Speak in Telugu, Hindi, or English to ask crop questions"}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Regional Language Buttons */}
            {onLanguageChange && (
              <div className="flex items-center space-x-1 bg-cream border border-warmborder rounded-lg p-0.5 shadow-subtle">
                {(['en', 'te', 'hi'] as Language[]).map((lang) => (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => {
                      handleStopAll();
                      onLanguageChange(lang);
                    }}
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

            <button
              onClick={() => {
                handleStopAll();
                onClose();
              }}
              className="p-1.5 rounded-lg text-muted hover:text-charcoal hover:bg-ivory transition-colors cursor-pointer"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-5">
          
          {/* Active Scan Context Badge if available */}
          {currentScan && (
            <div className="p-2.5 rounded-lg bg-ivory border border-warmborder text-xs flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Leaf className="w-4 h-4 text-secondary flex-shrink-0" />
                <span className="text-muted">{t.active_scan_context || "Active crop context"}:</span>
                <span className="font-bold text-primary">{currentScan.crop}</span>
                <span className="text-charcoal font-medium">({currentScan.condition})</span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded bg-cream border border-warmborder text-secondary-dark font-medium">
                {Math.round(currentScan.confidence * 100)}% visual match
              </span>
            </div>
          )}

          {/* Voice Microphone Center Section */}
          <div className="text-center py-3">
            
            {/* Big Mic Button with Pulsing Wave */}
            <div className="relative inline-block">
              {voiceState === 'listening' && (
                <div className="absolute inset-0 rounded-full bg-secondary/30 animate-ping" />
              )}
              <button
                type="button"
                onClick={handleToggleListening}
                className={`relative w-20 h-20 rounded-full flex items-center justify-center transition-all shadow-elevated cursor-pointer ${
                  voiceState === 'listening'
                    ? 'bg-danger text-cream ring-4 ring-danger/20 scale-105'
                    : 'bg-primary hover:bg-primary-dark text-cream hover:scale-105 active:scale-95'
                }`}
                title={voiceState === 'listening' ? "Tap to stop listening" : "Tap to speak"}
              >
                {voiceState === 'listening' ? (
                  <MicOff className="w-8 h-8 animate-pulse" />
                ) : (
                  <Mic className="w-8 h-8" />
                )}
              </button>
            </div>

            {/* Status Text Indicator */}
            <div className="mt-3">
              {voiceState === 'listening' && (
                <p className="text-sm font-bold text-danger flex items-center justify-center space-x-1.5 animate-pulse">
                  <span className="w-2 h-2 rounded-full bg-danger inline-block" />
                  <span>{t.voice_status_listening || "Listening... speak now"}</span>
                </p>
              )}
              {voiceState === 'processing' && (
                <p className="text-sm font-semibold text-primary flex items-center justify-center space-x-1.5">
                  <span className="w-2 h-2 rounded-full bg-primary inline-block animate-ping" />
                  <span>{t.voice_status_processing || "Finding verified guidance..."}</span>
                </p>
              )}
              {voiceState === 'speaking' && (
                <p className="text-sm font-semibold text-secondary-dark flex items-center justify-center space-x-1.5">
                  <Volume2 className="w-4 h-4 text-secondary animate-bounce" />
                  <span>{t.voice_status_speaking || "Speaking response..."}</span>
                </p>
              )}
              {voiceState === 'idle' && (
                <p className="text-xs sm:text-sm text-muted">
                  {t.voice_tap_prompt || "Tap the microphone and speak your question, or type below"}
                </p>
              )}
            </div>

          </div>

          {/* Voice Unavailable Warning Notice */}
          {voiceUnavailableWarning && (
            <div className="p-3 rounded-lg bg-alert-light border border-alert/30 text-alert text-xs flex items-start space-x-2">
              <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>{voiceUnavailableWarning}</span>
            </div>
          )}

          {/* Error Notice */}
          {errorMessage && (
            <div className="p-3 rounded-lg bg-danger-light border border-danger/30 text-danger text-xs flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Editable Transcript Textarea */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <label className="font-semibold text-charcoal">
                {t.voice_transcript_label || "Your Spoken or Typed Question:"}
              </label>
              {transcript && (
                <button
                  onClick={() => setTranscript('')}
                  className="text-muted hover:text-danger text-[11px] cursor-pointer"
                >
                  {t.voice_clear || "Clear"}
                </button>
              )}
            </div>

            <div className="relative">
              <textarea
                ref={textareaRef}
                value={transcript || interimText}
                onChange={(e) => setTranscript(e.target.value)}
                placeholder={t.voice_placeholder || "e.g. What should I do if my tomato leaf has dark brown spots?"}
                rows={3}
                className="w-full p-3.5 rounded-natural bg-ivory border border-warmborder focus:border-primary focus:ring-1 focus:ring-primary text-sm text-charcoal outline-none resize-none transition-all placeholder:text-muted/70"
              />
              {interimText && (
                <span className="absolute bottom-3 right-3 text-[10px] text-muted italic bg-cream/90 px-1.5 py-0.5 rounded border border-warmborder">
                  live transcript...
                </span>
              )}
            </div>

            {/* Submit Action Button */}
            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={() => handleSubmitQuery()}
                disabled={(!transcript && !interimText) || voiceState === 'processing'}
                className="px-5 py-2.5 rounded-natural bg-primary hover:bg-primary-dark disabled:opacity-50 text-cream font-semibold text-xs sm:text-sm shadow-subtle flex items-center space-x-2 transition-all cursor-pointer"
              >
                <span>{t.voice_submit_btn || "Ask Avani"}</span>
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Quick Clickable Suggestions */}
          {!responseAnswer && (
            <div className="pt-2 border-t border-warmborder/60">
              <p className="text-[11px] font-semibold text-muted mb-2">
                {t.voice_quick_examples || "Quick voice examples to try:"}
              </p>
              <div className="flex flex-wrap gap-2">
                {samplePrompts.map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleQuickPrompt(p)}
                    className="text-xs px-3 py-1.5 rounded-lg bg-ivory hover:bg-ivory-dark border border-warmborder text-charcoal hover:text-primary transition-colors text-left cursor-pointer shadow-subtle"
                  >
                    "{p}"
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Structured Voice Response Card */}
          {responseAnswer && (
            <div className="p-4 sm:p-5 rounded-natural bg-ivory border border-warmborder/80 space-y-3 animate-fade-in shadow-subtle">
              <div className="flex items-center justify-between border-b border-warmborder/60 pb-2.5">
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-4 h-4 text-primary" />
                  <span className="text-xs font-bold text-primary">
                    {t.voice_answer_heading || "Avani Verified Guidance"} {matchedCrop ? `(${matchedCrop})` : ''}
                  </span>
                </div>

                {/* Audio Listen / Stop controls */}
                <div className="flex items-center space-x-2">
                  {isSpeakingResponse ? (
                    <button
                      type="button"
                      onClick={handleStopSpeaking}
                      className="px-2.5 py-1 rounded bg-danger-light hover:bg-danger/20 text-danger text-xs font-medium flex items-center space-x-1 cursor-pointer transition-colors"
                      title="Stop speaking"
                    >
                      <Square className="w-3 h-3 fill-current" />
                      <span>{t.btn_stop_tts || "Stop"}</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => playResponseAudio(responseAnswer)}
                      className="px-2.5 py-1 rounded bg-primary/10 hover:bg-primary/20 text-primary text-xs font-medium flex items-center space-x-1 cursor-pointer transition-colors"
                      title="Replay audio"
                    >
                      <Volume2 className="w-3 h-3" />
                      <span>{t.btn_listen_tts || "Listen"}</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Spoken Answer Text */}
              <p className="text-xs sm:text-sm text-charcoal leading-relaxed">
                {responseAnswer}
              </p>

              {/* Action Pointers */}
              {responsePointers && responsePointers.length > 0 && (
                <div className="pt-2 border-t border-warmborder/40">
                  <h5 className="text-[11px] font-bold text-muted uppercase tracking-wider mb-1.5">
                    {t.voice_recommended_checks || "Key Steps:"}
                  </h5>
                  <ul className="space-y-1.5 text-xs text-charcoal-muted">
                    {responsePointers.map((ptr, idx) => (
                      <li key={idx} className="flex items-start space-x-2">
                        <span className="text-primary font-bold">•</span>
                        <span>{ptr}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Action: Ask another question */}
              <div className="pt-2 flex justify-between items-center text-[11px]">
                <span className="text-muted">
                  {t.voice_disclaimer || "Advisory based on verified ICAR agronomic guidance."}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setResponseAnswer(null);
                    setTranscript('');
                    handleToggleListening();
                  }}
                  className="text-primary hover:text-primary-dark font-semibold flex items-center space-x-1 cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>{t.voice_ask_another || "Ask another question"}</span>
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 bg-ivory/40 border-t border-warmborder flex items-center justify-between text-xs text-muted">
          <span>{t.voice_footer_hint || "Avani voice engine supports English, Telugu, and Hindi."}</span>
          <button
            onClick={() => {
              handleStopAll();
              onClose();
            }}
            className="px-4 py-1.5 rounded-lg bg-cream hover:bg-ivory border border-warmborder text-charcoal font-medium text-xs cursor-pointer"
          >
            {t.btn_close || "Close"}
          </button>
        </div>

      </div>
    </div>
  );
};
