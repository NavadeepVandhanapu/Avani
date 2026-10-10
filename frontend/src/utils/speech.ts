import type { Language } from '../types';
import { fetchTTSAudio } from '../services/api';

export interface RecognitionCallbacks {
  onStart?: () => void;
  onResult: (transcript: string, isFinal: boolean) => void;
  onError: (error: string, code?: string) => void;
  onEnd?: () => void;
}

// Support browser SpeechRecognition types
type SpeechRecognitionType = any;

export class SpeechAssistant {
  private static synth: SpeechSynthesis | null = typeof window !== 'undefined' ? window.speechSynthesis : null;
  private static recognition: SpeechRecognitionType | null = null;
  private static isListening: boolean = false;
  private static audioPlayer: HTMLAudioElement | null = null;
  private static currentAudioToken: number = 0;

  public static isTTSSupported(): boolean {
    return true; // Supported either via backend audio streaming or browser synthesis
  }

  public static isRecognitionSupported(): boolean {
    if (typeof window === 'undefined') return false;
    const win = window as any;
    return Boolean(win.SpeechRecognition || win.webkitSpeechRecognition);
  }

  public static getBCP47Lang(lang: Language): string {
    switch (lang) {
      case 'te': return 'te-IN';
      case 'hi': return 'hi-IN';
      case 'en':
      default: return 'en-IN';
    }
  }

  public static hasVoiceForLanguage(_lang: Language): boolean {
    // All supported languages (en, te, hi) are fully supported via backend TTS audio streaming
    return true;
  }

  public static speak(
    text: string,
    lang: Language,
    onEnd?: () => void,
    onVoiceUnavailable?: () => void
  ): void {
    this.stop();
    const token = ++this.currentAudioToken;

    const targetLang = this.getBCP47Lang(lang);

    // Check if browser has a native voice installed for this language
    let matchingVoice: SpeechSynthesisVoice | undefined;
    if (this.synth) {
      const voices = this.synth.getVoices();
      matchingVoice = voices.find(v => 
        v.lang.toLowerCase() === targetLang.toLowerCase() || 
        v.lang.toLowerCase().startsWith(lang.toLowerCase())
      );
    }

    // For Telugu / Hindi or whenever native browser voice is missing,
    // use backend high-quality TTS audio streaming
    const shouldUseBackendTTS = lang === 'te' || lang === 'hi' || !matchingVoice;

    if (shouldUseBackendTTS) {
      fetchTTSAudio(text, lang)
        .then(blob => {
          if (this.currentAudioToken !== token) return;
          const audioUrl = URL.createObjectURL(blob);
          const audio = new Audio(audioUrl);
          this.audioPlayer = audio;

          audio.onended = () => {
            URL.revokeObjectURL(audioUrl);
            this.audioPlayer = null;
            if (this.currentAudioToken === token && onEnd) onEnd();
          };

          audio.onerror = (e) => {
            console.warn("Backend audio playback error, falling back to browser speech:", e);
            URL.revokeObjectURL(audioUrl);
            this.audioPlayer = null;
            if (this.currentAudioToken === token) {
              this.speakWithBrowserSynth(text, lang, matchingVoice, onEnd, onVoiceUnavailable);
            }
          };

          audio.play().catch(err => {
            console.warn("Audio autoplay error, falling back to browser speech:", err);
            URL.revokeObjectURL(audioUrl);
            this.audioPlayer = null;
            if (this.currentAudioToken === token) {
              this.speakWithBrowserSynth(text, lang, matchingVoice, onEnd, onVoiceUnavailable);
            }
          });
        })
        .catch(err => {
          console.warn("Backend TTS request error, falling back to browser speech:", err);
          if (this.currentAudioToken === token) {
            this.speakWithBrowserSynth(text, lang, matchingVoice, onEnd, onVoiceUnavailable);
          }
        });
      return;
    }

    this.speakWithBrowserSynth(text, lang, matchingVoice, onEnd, onVoiceUnavailable);
  }

  private static speakWithBrowserSynth(
    text: string,
    lang: Language,
    matchingVoice?: SpeechSynthesisVoice,
    onEnd?: () => void,
    onVoiceUnavailable?: () => void
  ): void {
    if (!this.synth) {
      if (onEnd) onEnd();
      return;
    }

    const targetLang = this.getBCP47Lang(lang);
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = targetLang;
    utterance.rate = 0.92;
    utterance.pitch = 1.0;

    if (matchingVoice) {
      utterance.voice = matchingVoice;
    } else if (lang !== 'en') {
      if (onVoiceUnavailable) {
        onVoiceUnavailable();
      }
    }

    utterance.onend = () => {
      if (onEnd) onEnd();
    };

    utterance.onerror = (e) => {
      console.warn("Browser TTS playback error:", e);
      if (onEnd) onEnd();
    };

    this.synth.speak(utterance);
  }

  public static stop(): void {
    this.currentAudioToken++;
    if (this.synth) {
      this.synth.cancel();
    }
    if (this.audioPlayer) {
      try {
        this.audioPlayer.pause();
        this.audioPlayer.currentTime = 0;
      } catch (e) {
        // ignore
      }
      this.audioPlayer = null;
    }
    this.stopListening();
  }

  public static getIsSpeaking(): boolean {
    const isAudioPlaying = Boolean(this.audioPlayer && !this.audioPlayer.paused && !this.audioPlayer.ended);
    return (this.synth ? this.synth.speaking : false) || isAudioPlaying;
  }

  public static async startListening(
    lang: Language,
    callbacks: RecognitionCallbacks
  ): Promise<boolean> {
    if (!this.isRecognitionSupported()) {
      callbacks.onError("Speech recognition is not supported in this browser.", "not-supported");
      return false;
    }

    this.stopListening();

    // Ensure microphone permission is granted explicitly via getUserMedia to prevent Chrome localhost 'network' drop
    if (typeof navigator !== 'undefined' && navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        // Close temporary track after permission confirmation
        stream.getTracks().forEach(track => track.stop());
      } catch (err: any) {
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          callbacks.onError("Microphone permission was denied. Please allow microphone access in your browser.", "not-allowed");
          return false;
        }
      }
    }

    try {
      const win = window as any;
      const RecognitionClass = win.SpeechRecognition || win.webkitSpeechRecognition;
      const recog = new RecognitionClass();
      
      recog.continuous = false;
      recog.interimResults = true;
      recog.lang = this.getBCP47Lang(lang);
      recog.maxAlternatives = 1;

      recog.onstart = () => {
        this.isListening = true;
        if (callbacks.onStart) callbacks.onStart();
      };

      recog.onresult = (event: any) => {
        let finalTranscript = '';
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const item = event.results[i];
          const text = item[0]?.transcript || '';
          if (item.isFinal) {
            finalTranscript += text;
          } else {
            interimTranscript += text;
          }
        }

        const currentText = finalTranscript || interimTranscript;
        const isFinal = Boolean(finalTranscript && !interimTranscript);
        callbacks.onResult(currentText, isFinal);
      };

      recog.onerror = (event: any) => {
        this.isListening = false;
        const errCode = event.error || "unknown";
        let msg = "Could not recognize speech. Please try speaking again.";

        if (errCode === 'not-allowed' || errCode === 'permission-denied') {
          msg = "Microphone permission was denied. Please click the camera/mic icon in your browser address bar to allow access.";
        } else if (errCode === 'no-speech') {
          msg = "No speech was detected. Please tap the microphone and speak near your device.";
        } else if (errCode === 'network') {
          msg = "Browser speech server is temporarily unreachable or blocked by extensions. You can still type your question or click any prompt below.";
        }
        
        callbacks.onError(msg, errCode);
      };

      recog.onend = () => {
        this.isListening = false;
        if (callbacks.onEnd) callbacks.onEnd();
      };

      this.recognition = recog;
      recog.start();
      return true;
    } catch (e: any) {
      this.isListening = false;
      callbacks.onError("Failed to start voice recognition.", "initialization-failed");
      return false;
    }
  }

  public static stopListening(): void {
    if (this.recognition) {
      try {
        this.recognition.abort();
      } catch (_) {}
      this.recognition = null;
    }
    this.isListening = false;
  }

  public static getIsListening(): boolean {
    return this.isListening;
  }
}

// Web Speech API Voice Input (Speech-to-Text)
export class VoiceInputService {
  private static recognition: any = null;
  private static active: boolean = false;

  public static isSupported(): boolean {
    if (typeof window === 'undefined') return false;
    return !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);
  }

  public static startListening({
    lang,
    onResult,
    onError,
    onEnd,
  }: {
    lang: Language;
    onResult: (transcript: string, isFinal: boolean) => void;
    onError: (err: string) => void;
    onEnd: () => void;
  }): void {
    if (!this.isSupported()) {
      onError('Speech recognition is not supported in this browser. Please use Chrome, Edge, or Android Chrome.');
      return;
    }

    try {
      this.stopListening();

      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const rec = new SpeechRecognition();

      switch (lang) {
        case 'te':
          rec.lang = 'te-IN';
          break;
        case 'hi':
          rec.lang = 'hi-IN';
          break;
        case 'en':
        default:
          rec.lang = 'en-IN';
          break;
      }

      rec.continuous = false;
      rec.interimResults = true;
      rec.maxAlternatives = 1;

      rec.onstart = () => {
        this.active = true;
      };

      rec.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const item = event.results[i];
          if (item.isFinal) {
            finalTranscript += item[0].transcript;
          } else {
            interimTranscript += item[0].transcript;
          }
        }

        const text = finalTranscript || interimTranscript;
        if (text) {
          onResult(text.trim(), !!finalTranscript);
        }
      };

      rec.onerror = (event: any) => {
        this.active = false;
        console.warn('SpeechRecognition error:', event.error);
        if (event.error !== 'no-speech') {
          onError(event.error || 'Voice input failed.');
        }
      };

      rec.onend = () => {
        this.active = false;
        onEnd();
      };

      this.recognition = rec;
      rec.start();
    } catch (err: any) {
      this.active = false;
      onError(err?.message || 'Could not start microphone.');
    }
  }

  public static stopListening(): void {
    if (this.recognition) {
      try {
        this.recognition.abort();
      } catch (e) {
        // ignore
      }
      this.recognition = null;
    }
    this.active = false;
  }

  public static isListening(): boolean {
    return this.active;
  }

  /**
   * Intelligently maps farmer spoken phrase to the best question option
   */
  public static matchOption(
    spokenText: string,
    options: Array<{ label: { en: string; te: string; hi: string }; value: string }>,
    lang: Language
  ): string | null {
    if (!spokenText) return null;
    const cleanSpoken = spokenText.toLowerCase().trim();

    // 1. Exact or partial substring match in current language label
    for (const opt of options) {
      const lbl = opt.label[lang].toLowerCase();
      if (lbl.includes(cleanSpoken) || cleanSpoken.includes(lbl)) {
        return opt.value;
      }
    }

    // 2. Multilingual aliases check across English, Telugu, Hindi
    for (const opt of options) {
      const enLbl = opt.label.en.toLowerCase();
      const teLbl = opt.label.te.toLowerCase();
      const hiLbl = opt.label.hi.toLowerCase();
      const val = opt.value.toLowerCase();

      if (cleanSpoken.includes(enLbl) || enLbl.includes(cleanSpoken) ||
          cleanSpoken.includes(teLbl) || teLbl.includes(cleanSpoken) ||
          cleanSpoken.includes(hiLbl) || hiLbl.includes(cleanSpoken) ||
          cleanSpoken.includes(val) || val.includes(cleanSpoken)) {
        return opt.value;
      }
    }

    // 3. Fallback keywords
    const keywordMap: Record<string, string[]> = {
      'Tomato': ['tomato', 'టమోటా', 'టమాట', 'టమోటో', 'टमाटर'],
      'Potato': ['potato', 'ఆలు', 'ఆలూ', 'బంగాళాదుంప', 'బంగాళదుంప', 'आलू'],
      'Corn (Maize)': ['corn', 'maize', 'మొక్కజొన్న', 'జొన్న', 'మక్క', 'मक्का', 'भुट्टा'],
      'Pepper / Chili': ['chili', 'pepper', 'capsicum', 'మిరప', 'మిర్చి', 'కాప్సికం', 'मिर्च', 'शिमला मिर्च'],
      'Apple': ['apple', 'యాపిల్', 'ఆపిల్', 'सेब'],
      'Grape': ['grape', 'ద్రాక్ష', 'అంగూర్', 'अंगूर'],
      'Rice (Paddy)': ['rice', 'paddy', 'వరి', 'వరి పంట', 'ధాన్యం', 'चावल', 'धान'],
      'Seedling / Early': ['seedling', 'early', 'నారు', 'మొలక', 'చిన్న', 'पौध', 'छोटा पौधा', 'पहला'],
      'Vegetative Growth': ['vegetative', 'growth', 'ఆకులు', 'శాఖీయ', 'పెరుగుదల', 'కొమ్మలు', 'बढ़वार'],
      'Flowering Stage': ['flowering', 'flower', 'పూత', 'పువ్వు', 'పూలు', 'फूल'],
      'Fruiting / Maturity': ['fruiting', 'fruit', 'కాత', 'కాయ', 'గింజ', 'ముదిరిన', 'फल', 'दाना'],
      '< 5% (Isolated plants)': ['isolated', 'very low', 'తక్కువ', '5%', '5 శాతం', 'కొద్దిగా', 'ఒకటి రెండు', 'कम', 'बहुत कम'],
      '5-20% (Scattered patches)': ['scattered', 'patch', 'కొన్ని', 'మధ్యస్థం', '5-20%', 'कुछ हिस्से'],
      '> 50% (Severe)': ['severe', 'heavy', 'majority', 'ఎక్కువ', 'సగానికి పైగా', '50%', 'మొత్తం', 'తీవ్రం', 'ज्यादा', 'गंभीर'],
      'None / Single Crop': ['single', 'none', 'ఒకే పంట', 'వేరే లేదు', 'ఏమీ లేదు', 'एकल', 'केवल'],
      'Low / Clean field': ['clean', 'no weeds', 'కలుపు లేదు', 'శుభ్రం', 'పరిశుభ్రం', 'సాఫ్', 'साफ', 'खरपतवार नहीं'],
      'Heavy weeds': ['heavy weed', 'కలుపు ఎక్కువ', 'చాలా కలుపు', 'ఘనా', 'घना खरपतवार'],
      '1-2 days ago': ['1-2 days', 'yesterday', 'today', 'నిన్న', 'మొన్న', 'రెండు రోజులు', 'నిన్ననే', 'ఇప్పుడే', 'कल', 'आज', 'दो दिन'],
      'About 1 week ago': ['week', 'వారం', 'వారం క్రితం', 'హఫ్తా', 'एक हफ्ता', 'सप्ताह'],
      'Spreading slowly': ['slow', 'నెమ్మదిగా', 'కొద్దికొద్దిగా', 'పాకుతోంది', 'धीरे'],
      'Spreading rapidly': ['rapid', 'fast', 'వేగంగా', 'చాలా వేగంగా', 'తేజీ', 'तेजी से'],
      'Heavy rain / fog': ['rain', 'fog', 'weather', 'వర్షం', 'మంచు', 'భారీ వర్షం', 'తేమ', 'बारिश', 'कोहरा', 'नमी'],
      'Normal drip / furrow': ['drip', 'normal', 'డ్రిప్', 'సాధారణ', 'నీరు', 'నార్మల్', 'ड्रिप', 'सामान्य']
    };

    for (const [val, keywords] of Object.entries(keywordMap)) {
      for (const kw of keywords) {
        if (cleanSpoken.includes(kw.toLowerCase())) {
          return val;
        }
      }
    }

    return null;
  }
}
