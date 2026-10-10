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
