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
