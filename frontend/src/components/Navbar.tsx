import React from 'react';
import { History, CloudSun, Globe, Volume2, VolumeX, Mic, Bell } from 'lucide-react';
import type { Language, WeatherData } from '../types';
import { TRANSLATIONS } from '../translations';

interface NavbarProps {
  currentLang: Language;
  onLanguageChange: (lang: Language) => void;
  onOpenHistory: () => void;
  onOpenWeather: () => void;
  onOpenVoiceAssistant?: () => void;
  onOpenNotifications?: () => void;
  onGoHome: () => void;
  scanCount: number;
  notificationCount?: number;
  weatherData?: WeatherData | null;
  isSpeaking: boolean;
  onToggleSpeech: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentLang,
  onLanguageChange,
  onOpenHistory,
  onOpenWeather,
  onOpenVoiceAssistant,
  onOpenNotifications,
  onGoHome,
  scanCount,
  notificationCount = 4,
  weatherData,
  isSpeaking,
  onToggleSpeech
}) => {
  const t = TRANSLATIONS[currentLang];

  return (
    <header className="sticky top-0 z-40 bg-cream border-b border-warmborder shadow-subtle">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        
        {/* Brand / Logo */}
        <button 
          onClick={onGoHome}
          className="flex items-center space-x-3 text-left group focus:outline-none cursor-pointer"
          title="Avani"
        >
          <div className="w-11 h-11 rounded-xl bg-white p-1 border border-warmborder flex items-center justify-center shadow-subtle group-hover:border-primary transition-all">
            <img src="/logo.png" alt="Avani Logo" className="w-full h-full object-contain rounded-lg" />
          </div>
          <div>
            <span className="text-xl font-bold tracking-tight text-primary font-sans block leading-tight">
              {t.app_title}
            </span>
            <p className="text-[11px] text-muted font-medium hidden sm:block">
              {t.tagline}
            </p>
          </div>
        </button>

        {/* Action Controls */}
        <div className="flex items-center space-x-2 sm:space-x-2.5">
          
          {/* Voice Assistant Action */}
          {onOpenVoiceAssistant && (
            <button
              onClick={onOpenVoiceAssistant}
              className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg border border-primary/20 bg-primary/10 hover:bg-primary/20 text-primary text-xs font-semibold transition-colors cursor-pointer"
              title={t.voice_assistant_btn}
              id="navbar-voice-assistant-btn"
            >
              <Mic className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{t.voice_assistant_btn}</span>
            </button>
          )}

          {/* Weather Indicator */}
          {weatherData && (
            <button
              onClick={onOpenWeather}
              className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg border border-warmborder bg-ivory text-charcoal hover:bg-warmborder/30 text-xs font-medium transition-colors cursor-pointer"
              title="Weather"
            >
              <CloudSun className="w-4 h-4 text-ochre" />
              <span>{weatherData.temperature}°C</span>
            </button>
          )}

          {/* Real-time Notifications Bell */}
          <button
            onClick={onOpenNotifications}
            className="relative p-2 rounded-lg border border-warmborder bg-ivory text-charcoal hover:bg-warmborder/30 transition-colors cursor-pointer"
            title="Real-Time Agro & Disease Alerts"
            aria-label="Real-time notifications"
          >
            <Bell className="w-4 h-4 text-ochre" />
            {notificationCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-ochre text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center shadow-subtle animate-bounce">
                {notificationCount}
              </span>
            )}
          </button>

          {/* Audio TTS Toggle */}
          <button
            onClick={onToggleSpeech}
            className={`p-2 rounded-lg border transition-colors cursor-pointer ${
              isSpeaking
                ? 'bg-primary text-cream border-primary animate-pulse'
                : 'bg-ivory text-charcoal border-warmborder hover:bg-warmborder/30'
            }`}
            title={isSpeaking ? t.btn_stop_tts : t.btn_listen_tts}
            aria-label="Text to speech"
          >
            {isSpeaking ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          {/* Previous Scans */}
          <button
            onClick={onOpenHistory}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-warmborder bg-ivory text-charcoal hover:bg-warmborder/30 text-xs sm:text-sm font-medium transition-colors cursor-pointer"
            title={t.view_previous_scans}
          >
            <History className="w-4 h-4 text-primary" />
            <span className="hidden sm:inline">{t.view_previous_scans}</span>
            {scanCount > 0 && (
              <span className="bg-primary text-cream text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                {scanCount}
              </span>
            )}
          </button>

          {/* Language Selector */}
          <div className="relative flex items-center">
            <Globe className="w-3.5 h-3.5 text-muted absolute left-2.5 pointer-events-none" />
            <select
              value={currentLang}
              onChange={(e) => onLanguageChange(e.target.value as Language)}
              className="pl-7 pr-3 py-1.5 rounded-lg border border-warmborder bg-ivory text-charcoal text-xs sm:text-sm font-medium hover:bg-warmborder/30 focus:ring-1 focus:ring-primary cursor-pointer appearance-none"
              aria-label="Language"
            >
              <option value="en">English</option>
              <option value="te">తెలుగు</option>
              <option value="hi">हिन्दी</option>
            </select>
          </div>

        </div>

      </div>
    </header>
  );
};
