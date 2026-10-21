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
          const audioUrl = URL.createObjectURL(blob);
          const audio = new Audio(audioUrl);
          this.audioPlayer = audio;

          audio.onended = () => {
            URL.revokeObjectURL(audioUrl);
            this.audioPlayer = null;
            if (onEnd) onEnd();
          };

          audio.onerror = (e) => {
            console.warn("Backend audio playback error, falling back to browser speech:", e);
            URL.revokeObjectURL(audioUrl);
            this.audioPlayer = null;
            this.speakWithBrowserSynth(text, lang, matchingVoice, onEnd, onVoiceUnavailable);
          };

          audio.play().catch(err => {
            console.warn("Audio autoplay error, falling back to browser speech:", err);
            URL.revokeObjectURL(audioUrl);
            this.audioPlayer = null;
            this.speakWithBrowserSynth(text, lang, matchingVoice, onEnd, onVoiceUnavailable);
          });
        })
        .catch(err => {
          console.warn("Backend TTS request error, falling back to browser speech:", err);
          this.speakWithBrowserSynth(text, lang, matchingVoice, onEnd, onVoiceUnavailable);
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

  public static async startListening({
    lang,
    onResult,
    onError,
    onEnd,
  }: {
    lang: Language;
    onResult: (transcript: string, isFinal: boolean) => void;
    onError: (err: string, code?: string) => void;
    onEnd: () => void;
  }): Promise<boolean> {
    if (!this.isSupported()) {
      onError('Speech recognition is not supported in this browser. Please use Google Chrome or Microsoft Edge.', 'not-supported');
      return false;
    }

    // Stop any ongoing TTS audio so mic does not hear synthesized speech
    SpeechAssistant.stop();
    this.stopListening();

    try {
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
      rec.maxAlternatives = 3;

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
        const errCode = event.error || 'unknown';
        console.warn('SpeechRecognition error:', errCode);

        let userMsg = 'Could not recognize speech. Please speak near your device.';
        if (errCode === 'not-allowed' || errCode === 'permission-denied') {
          userMsg = 'Microphone permission was denied. Please click the mic icon in your address bar to allow access.';
        } else if (errCode === 'no-speech') {
          userMsg = 'No speech was detected. Please tap the mic and speak your answer clearly.';
        } else if (errCode === 'network') {
          userMsg = 'Browser speech server connection interrupted. You can still tap any option below.';
        }

        onError(userMsg, errCode);
      };

      rec.onend = () => {
        this.active = false;
        onEnd();
      };

      this.recognition = rec;
      rec.start();
      return true;
    } catch (err: any) {
      this.active = false;
      onError(err?.message || 'Could not start microphone.', 'initialization-failed');
      return false;
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
   * Intelligently maps farmer spoken phrase to the best question option.
   * Supports:
   * 1. Ordinals / numbers (1, 2, 3 / first, second / ఒకటి, రెండు / पहला, दूसरा)
   * 2. Direct string match across English, Telugu, and Hindi labels
   * 3. Comprehensive agronomic keywords for all dynamic questionnaire categories
   */
  public static matchOption(
    spokenText: string,
    options: Array<{ label: { en: string; te: string; hi: string }; value: string }>,
    lang: Language
  ): string | null {
    if (!spokenText || !options || options.length === 0) return null;
    const cleanSpoken = spokenText.toLowerCase().trim();

    // 1. Ordinal & number detection (e.g. "option 1", "first option", "ఒకటి", "రెండవది", "पहला")
    const indexMatchers: Array<{ patterns: string[]; index: number }> = [
      {
        patterns: ['1', 'one', 'first', 'option 1', 'option one', 'ఒకటి', 'ఒకటవది', 'మొదటిది', 'మొదటి', 'पहला', 'एक', 'पहला विकल्प'],
        index: 0
      },
      {
        patterns: ['2', 'two', 'second', 'option 2', 'option two', 'రెండు', 'రెండవది', 'రెండవ', 'दूसरा', 'दो', 'दूसरा विकल्प'],
        index: 1
      },
      {
        patterns: ['3', 'three', 'third', 'option 3', 'option three', 'మూడు', 'మూడవది', 'మూడవ', 'तीसरा', 'तीन', 'तीसरा विकल्प'],
        index: 2
      },
      {
        patterns: ['4', 'four', 'fourth', 'option 4', 'option four', 'నాలుగు', 'నాలుగవది', 'నాలుగవ', 'चौथा', 'चार', 'चौथा विकल्प'],
        index: 3
      },
      {
        patterns: ['5', 'five', 'fifth', 'option 5', 'option five', 'ఐదు', 'ఐదవది', 'ఐదవ', 'पांच', 'पांचवां', 'पांचवां विकल्प'],
        index: 4
      }
    ];

    for (const m of indexMatchers) {
      if (m.index < options.length) {
        for (const pat of m.patterns) {
          // Exact match or isolated word match
          if (cleanSpoken === pat || cleanSpoken.startsWith(`${pat} `) || cleanSpoken.endsWith(` ${pat}`) || cleanSpoken.includes(` ${pat} `)) {
            return options[m.index].value;
          }
        }
      }
    }

    // 2. Direct substring match in current language label
    for (const opt of options) {
      const lbl = (opt.label[lang] || '').toLowerCase().trim();
      if (lbl && (lbl.includes(cleanSpoken) || cleanSpoken.includes(lbl))) {
        return opt.value;
      }
    }

    // 3. Multilingual check across English, Telugu, and Hindi labels
    for (const opt of options) {
      const enLbl = (opt.label.en || '').toLowerCase().trim();
      const teLbl = (opt.label.te || '').toLowerCase().trim();
      const hiLbl = (opt.label.hi || '').toLowerCase().trim();
      const val = opt.value.toLowerCase().trim();

      if (enLbl && (cleanSpoken.includes(enLbl) || enLbl.includes(cleanSpoken))) return opt.value;
      if (teLbl && (cleanSpoken.includes(teLbl) || teLbl.includes(cleanSpoken))) return opt.value;
      if (hiLbl && (cleanSpoken.includes(hiLbl) || hiLbl.includes(cleanSpoken))) return opt.value;
      if (val && (cleanSpoken.includes(val) || val.includes(cleanSpoken))) return opt.value;
    }

    // 4. Word-level overlap match (if at least 2 significant words match an option label)
    const spokenWords = cleanSpoken.split(/\s+/).filter(w => w.length > 2);
    for (const opt of options) {
      const combinedTarget = `${opt.label.en} ${opt.label.te} ${opt.label.hi} ${opt.value}`.toLowerCase();
      let matchCount = 0;
      for (const w of spokenWords) {
        if (combinedTarget.includes(w)) {
          matchCount++;
        }
      }
      if (matchCount >= 2 || (spokenWords.length === 1 && matchCount === 1)) {
        return opt.value;
      }
    }

    // 5. Rich semantic agronomic keyword mapping covering ALL dynamic questionnaire categories
    const agronomicKeywords: Record<string, string[]> = {
      // Crop confirmations
      'Tomato': ['tomato', 'టమోటా', 'టమాట', 'టమోటో', 'टमाटर'],
      'Potato': ['potato', 'ఆలు', 'ఆలూ', 'బంగాళాదుంప', 'బంగాళదుంప', 'आलू'],
      'Corn (Maize)': ['corn', 'maize', 'మొక్కజొన్న', 'జొన్న', 'మక్క', 'मक्का', 'भुट्टा'],
      'Pepper / Chili': ['chili', 'pepper', 'capsicum', 'మిరప', 'మిర్చి', 'కాప్సికం', 'మిర్చిపంట', 'मिर्च', 'शिमला मिर्च'],
      'Apple': ['apple', 'యాపిల్', 'ఆపిల్', 'సేబ్', 'सेब'],
      'Grape': ['grape', 'ద్రాక్ష', 'అంగూర్', 'అంగూర', 'अंगूर'],
      'Rice (Paddy)': ['rice', 'paddy', 'వరి', 'వరి పంట', 'ధాన్యం', 'వరిచేను', 'चावल', 'धान'],
      'Other Crop': ['other', 'వేరే', 'ఇతర', 'వేరే పంట', 'అన్యం', 'अन्य'],

      // Leaf tier
      'Lower / older leaves first': ['lower', 'old', 'bottom', 'కింది', 'కింద', 'అడుగున', 'పాత ఆకులు', 'కింది ఆకులు', 'నిచలి', 'निचली', 'पुरानी', 'नीचे'],
      'Upper / new leaves first': ['upper', 'top', 'new', 'పై', 'పై ఆకులు', 'కొత్త ఆకులు', 'చిగురు', 'చిగుర్లు', 'ऊपरी', 'नई पत्तियां', 'ऊपर'],
      'All leaves uniformly': ['all', 'uniform', 'whole', 'అన్ని', 'మొత్తం', 'అంతటా', 'పొలమంతా', 'అన్ని ఆకులు', 'सभी', 'पूरे पौधे'],

      // Crop stage
      'Seedling / Early': ['seedling', 'early', 'నారు', 'మొలక', 'చిన్న', 'నారుమడి', 'చిన్న మొక్క', 'पौध', 'छोटा पौधा', 'शुरुआती'],
      'Vegetative Growth': ['vegetative', 'growth', 'శాఖీయ', 'పెరుగుదల', 'కొమ్మలు', 'ఆకులు ఎక్కువ', 'बढ़वार', 'शाखाएं'],
      'Flowering Stage': ['flowering', 'flower', 'bloom', 'పూత', 'పువ్వు', 'పూలు', 'పూత దశ', 'फूल', 'फूल आना'],
      'Fruiting / Maturity': ['fruiting', 'fruit', 'కాత', 'కాయ', 'గింజ', 'కాయలు', 'ముదిరిన', 'फल', 'दाना', 'पकना'],

      // Field spread %
      '< 5% (Isolated plants)': ['isolated', 'less than 5', 'తక్కువ', '5%', '5 శాతం', 'కొద్దిగా', 'ఒకటి రెండు', 'విడిగా', 'చాలా తక్కువ', 'कम', 'बहुत कम', 'छिटपुट'],
      '5-20% (Scattered patches)': ['scattered', 'patch', 'కొన్ని', 'మధ్యస్థం', '5-20%', '5 నుండి 20', 'కొన్ని చోట్ల', 'कुछ हिस्से', 'मध्यम'],
      '> 50% (Severe)': ['severe', 'heavy', 'majority', 'all over', 'ఎక్కువ', 'సగానికి పైగా', '50%', '50 శాతం కంటే ఎక్కువ', 'మొత్తం', 'తీవ్రం', 'తీవ్రంగా', 'చాలా ఎక్కువ', 'ज्यादा', 'गंभीर', '50% से ज्यादा'],

      // Duration
      '1-2 days ago': ['1-2 days', 'yesterday', 'today', 'recent', 'నిన్న', 'మొన్న', 'రెండు రోజులు', 'నిన్ననే', 'ఇప్పుడే', 'ఒకటి రెండు రోజులు', 'कल', 'आज', 'दो दिन', 'हाल ही में'],
      '3-7 days ago': ['3-7 days', 'week', 'వారం', 'వారం క్రితం', 'నాలుగు రోజులు', 'ఐదు రోజులు', 'కొన్ని రోజులు', 'హఫ్తా', 'एक हफ्ता', '3-7 दिन'],
      '> 2 weeks ago': ['2 weeks', 'long time', 'రెండు వారాలు', 'పది రోజులు', 'చాలా రోజులు', 'నెల', 'రెండు వారాల కంటే ఎక్కువ', '2 हफ्ते से ज्यादा', 'बहुत दिन'],

      // Spread speed
      'Spreading slowly': ['slow', 'నెమ్మదిగా', 'కొద్దికొద్దిగా', 'పాకుతోంది', 'నిదానంగా', 'ఆలస్యంగా', 'धीरे', 'धीमी गति'],
      'Spreading rapidly': ['rapid', 'fast', 'quick', 'వేగంగా', 'చాలా వేగంగా', 'త్వరగా', 'గబగబా', 'తేజీ', 'तेजी से', 'जल्दी'],
      'Remained the same': ['same', 'stable', 'stopped', 'అలాగే ఉంది', 'ఆగింది', 'పెరగలేదు', 'స్థిరంగా', 'మార్పు లేదు', 'रुका हुआ', 'स्थिर', 'वैसा ही'],

      // Weather / moisture
      'Heavy rain / high humidity / fog': ['rain', 'fog', 'humidity', 'wet', 'వర్షం', 'మంచు', 'భారీ వర్షం', 'తేమ', 'చీకటి', 'తుఫాను', 'కురిసింది', 'बारिश', 'कोहरा', 'नमी', 'गीला'],
      'Dry / normal weather': ['dry', 'normal', 'hot', 'sun', 'ఎండ', 'పొడి', 'వేడి', 'సాధారణ', 'వర్షం లేదు', 'డ్రై', 'सूखा', 'धूप', 'सामान्य'],

      // Spot appearance (dynamic leaf spot)
      'Concentric dark rings (Target board)': ['concentric', 'rings', 'target', 'వలయాలు', 'చక్రాలు', 'చక్రాల వంటి', 'చుట్లు', 'గుండ్రని వలయాలు', 'छल्ले', 'गोल छल्ले', 'कंसेंट्रिक'],
      'Irregular angular brown spots': ['irregular', 'angular', 'కోణీయ', 'క్రమరహిత', 'కోణాలు', 'మూలల వంటి', 'अनियमित', 'कोणीय धब्बे'],
      'Small circular spots with dark border': ['small circular', 'border', 'చిన్న', 'గుండ్రని', 'చిన్న మచ్చలు', 'నల్లటి అంచు', 'छोटे गोल धब्बे', 'किनारे'],
      'Water-soaked dark lesions': ['water soaked', 'lesion', 'తడి', 'నీటి మచ్చలు', 'కుళ్ళు', 'ముదురు మచ్చలు', 'जलभराव', 'पानी जैसे धब्बे'],

      // Rust pustules
      'Powdery golden-orange pustules': ['powder', 'golden', 'orange', 'పౌడర్', 'పొడి', 'నారింజ', 'పసుపు పొడి', 'బంగారు', 'पाउडर', 'नारंगी फफूंद'],
      'Dark brown / black raised pustules': ['raised', 'dark brown', 'black', 'ఎత్తైన', 'నల్లటి', 'గోధుమ', 'ఉబ్బిన', 'उभरे हुए', 'काले धब्बे'],
      'Flat yellow spots (no powder)': ['flat', 'yellow spots', 'చదును', 'పొడి లేదు', 'పసుపు మచ్చలు', 'సమతలంగా', 'चपटे धब्बे', 'पाउडर नहीं'],

      // Blight progression
      'Lesions with yellow halo (Early blight)': ['halo', 'yellow halo', 'early blight', 'ఎర్లీ బ్లైట్', 'పసుపు రంగు అంచు', 'హలో', 'పీలా గేరా', 'पीला घेरा', 'अगेती'],
      'Rapidly spreading water-soaked rot (Late blight)': ['late blight', 'water soaked rot', 'లేట్ బ్లైట్', 'కుళ్ళు', 'వేగంగా కుళ్ళిపోవడం', 'నీటి కుళ్ళు', 'पछेती', 'पानी जैसा सड़न'],
      'Elongated streaks along leaf veins': ['streak', 'veins', 'elongated', 'చారలు', 'ఈనెలు', 'రేఖలు', 'పొడవాటి చారలు', 'धारियां', 'नसें'],
      'Tip and margin burn only': ['tip', 'margin', 'burn', 'కొనలు', 'అంచులు', 'ఎండిపోవడం', 'మాడిపోవడం', 'చివర్లు', 'किनारे जलना', 'नोक'],

      // Mildew symptoms
      'White powdery dusting on surface': ['white powdery', 'dusting', 'తెల్లటి', 'బూడిద', 'పిండి', 'చూర్ణం', 'పైభాగం', 'सफेद पाउडर', 'धूल'],
      'Velvety olive-brown mold underneath': ['velvety', 'underneath', 'mold', 'ఆకు కింద', 'మసి', 'వెల్వెట్', 'బూజు', 'కింది భాగం', 'फफूंद', 'निचली सतह'],
      'Grey fuzzy mold on stems and leaves': ['grey fuzzy', 'fuzzy', 'బూడిద రంగు', 'కాండం', 'కొమ్మలపై', 'ग्रे फफूंद', 'तना'],

      // Viral symptoms
      'Severe upward / downward leaf curl': ['curl', 'leaf curl', 'ముడుచుకుపోవడం', 'ముడత', 'ఆకు ముడత', 'పైకి ముడుచుకోవడం', 'కిందికి ముడత', 'पत्ती मुड़ना', 'मुड़ाव'],
      'Mosaic yellow-green mottled pattern': ['mosaic', 'mottled', 'మొజాయిక్', 'రంగులు మారడం', 'పసుపు పచ్చ చారలు', 'चितकबरा', 'मोज़ेक'],
      'Fine webbing on underside (Spider mites)': ['webbing', 'spider mites', 'mites', 'బూజు', 'నల్లులు', 'సాలెగూడు', 'పురుగులు', 'मकड़ी जाला', 'माइट्स'],
      'Thickened leathery puckered leaves': ['leathery', 'thick', 'మందంగా', 'తోలు వంటి', 'మోటుగా', 'దళసరి', 'मोटी पत्तियां', 'कड़ी पत्तियां'],

      // Healthy crop observations
      'No other symptoms': ['no symptoms', 'healthy', 'clear', 'fine', 'ఏమీ లేదు', 'వేరే లక్షణాలు లేవు', 'సమస్య లేదు', 'బాగుంది', 'ఆరోగ్యంగా', 'कोई लक्षण नहीं', 'सब ठीक'],
      'Some leaves wilting / dropping': ['wilting', 'dropping', 'వాడిపోవడం', 'రాలిపోవడం', 'వడలిపోవడం', 'ఆకులు రాలడం', 'मुरझाना', 'पत्तियां गिरना'],
      'Yellowing patches on canopy': ['yellowing', 'canopy', 'పసుపు పచ్చ', 'పచ్చదనం తగ్గింది', 'పసుపు మచ్చలు', 'చెట్టు పసుపు', 'पीलापन', 'पीले पैच'],
      'Stunted growth / small leaves': ['stunted', 'small leaves', 'ఎదగడం లేదు', 'ఎదుగుదల లేదు', 'చిన్న ఆకులు', 'పొట్టిగా', 'बौना पौधा', 'छोटी पत्तियां']
    };

    // Check agronomic keywords against options
    for (const opt of options) {
      const keywords = agronomicKeywords[opt.value];
      if (keywords) {
        for (const kw of keywords) {
          if (cleanSpoken.includes(kw.toLowerCase())) {
            return opt.value;
          }
        }
      }
    }

    return null;
  }
}
