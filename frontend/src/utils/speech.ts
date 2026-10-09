import type { Language } from '../types';

export class SpeechAssistant {
  private static synth: SpeechSynthesis | null = typeof window !== 'undefined' ? window.speechSynthesis : null;

  public static isSupported(): boolean {
    return typeof window !== 'undefined' && 'speechSynthesis' in window;
  }

  public static speak(text: string, lang: Language, onEnd?: () => void): void {
    if (!this.synth) return;
    
    // Stop any ongoing speech
    this.synth.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    
    switch (lang) {
      case 'te':
        utterance.lang = 'te-IN';
        break;
      case 'hi':
        utterance.lang = 'hi-IN';
        break;
      case 'en':
      default:
        utterance.lang = 'en-IN';
        break;
    }

    utterance.rate = 0.95;
    utterance.pitch = 1.0;

    utterance.onend = () => {
      if (onEnd) onEnd();
    };

    utterance.onerror = (e) => {
      console.warn("TTS Notice:", e);
      if (onEnd) onEnd();
    };

    this.synth.speak(utterance);
  }

  public static stop(): void {
    if (this.synth) {
      this.synth.cancel();
    }
  }

  public static getIsSpeaking(): boolean {
    return this.synth ? this.synth.speaking : false;
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
