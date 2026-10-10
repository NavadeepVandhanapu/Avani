import React from 'react';
import { Camera, History, CloudSun, Globe, Mic } from 'lucide-react';
import type { Language, WeatherData } from '../types';
import { TRANSLATIONS } from '../translations';

interface WelcomeHeroProps {
  currentLang: Language;
  onLanguageChange: (lang: Language) => void;
  onStartScan: () => void;
  onOpenHistory: () => void;
  onOpenWeather: () => void;
  onOpenVoiceAssistant?: () => void;
  scanCount: number;
  weatherData?: WeatherData | null;
}

export const WelcomeHero: React.FC<WelcomeHeroProps> = ({
  currentLang,
  onLanguageChange,
  onStartScan,
  onOpenHistory,
  onOpenWeather,
  onOpenVoiceAssistant,
  scanCount,
  weatherData
}) => {
  const t = TRANSLATIONS[currentLang];

  return (
    <div className="py-6 sm:py-10 max-w-xl mx-auto px-4">
      
      {/* Main Farmer-First Welcome Card */}
      <div className="bg-cream border border-warmborder rounded-card p-6 sm:p-8 shadow-card text-center">
        
        {/* Language Selector Bar (Prominent & Accessible) */}
        <div className="flex items-center justify-center space-x-1.5 mb-6 pb-4 border-b border-warmborder/80">
          <Globe className="w-4 h-4 text-secondary-dark mr-1" />
          <span className="text-xs font-semibold text-charcoal mr-2">{t.select_language}:</span>
          
          {(['en', 'te', 'hi'] as Language[]).map((lang) => (
            <button
              key={lang}
              type="button"
              onClick={() => onLanguageChange(lang)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                currentLang === lang
                  ? 'bg-primary text-cream shadow-subtle'
                  : 'bg-ivory text-charcoal hover:bg-warmborder/50 border border-warmborder'
              }`}
            >
              {lang === 'en' ? 'English' : lang === 'te' ? 'తెలుగు' : 'हिन्दी'}
            </button>
          ))}
        </div>

        {/* Brand & Purpose */}
        <div className="mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 text-primary mb-3">
            {/* Clean, authentic botanical leaf icon */}
            <svg 
              viewBox="0 0 24 24" 
              className="w-8 h-8 fill-none stroke-current" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
              <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
            </svg>
          </div>

          <h2 className="text-2xl font-bold tracking-tight text-primary font-sans">
            {t.app_title}
          </h2>
          <p className="text-xs sm:text-sm text-secondary-dark font-medium mt-0.5">
            “{t.tagline}”
          </p>
        </div>

        {/* Purposeful Agricultural Visual */}
        <div className="my-5 max-w-xs mx-auto rounded-2xl overflow-hidden border border-warmborder bg-ivory/60 p-3 shadow-subtle flex items-center justify-center">
          <svg
            viewBox="0 0 320 160"
            className="w-full h-auto text-primary"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Ground / Furrows */}
            <path d="M10 145 C 90 135, 230 155, 310 145" stroke="#E6E5DA" strokeWidth="4" strokeLinecap="round" />
            <path d="M30 152 C 120 145, 200 155, 290 152" stroke="#D5D3C5" strokeWidth="2.5" strokeLinecap="round" />

            {/* Central Crop Plant */}
            <path d="M160 140 Q 160 70 160 40" stroke="#285943" strokeWidth="4.5" strokeLinecap="round" />
            
            {/* Left Leaf */}
            <path 
              d="M160 100 C 130 90 100 80 80 95 C 95 115 130 120 160 110 Z" 
              fill="#78966A" 
              stroke="#285943" 
              strokeWidth="2" 
            />
            <path d="M160 100 C 130 96 100 90 85 96" stroke="#285943" strokeWidth="1.5" />

            {/* Right Leaf */}
            <path 
              d="M160 80 C 190 70 220 60 240 75 C 225 95 190 100 160 90 Z" 
              fill="#78966A" 
              stroke="#285943" 
              strokeWidth="2" 
            />
            <path d="M160 80 C 190 76 220 70 235 76" stroke="#285943" strokeWidth="1.5" />

            {/* Top Young Shoot */}
            <path 
              d="M160 40 C 145 25 150 10 160 12 C 170 10 175 25 160 40 Z" 
              fill="#8FAE7F" 
              stroke="#285943" 
              strokeWidth="2" 
            />
            
            {/* Gentle Sun Arc */}
            <circle cx="270" cy="35" r="16" fill="#F8F7F0" stroke="#C6A15B" strokeWidth="3" />
            <path d="M270 12 L270 5" stroke="#C6A15B" strokeWidth="2" strokeLinecap="round" />
            <path d="M293 35 L300 35" stroke="#C6A15B" strokeWidth="2" strokeLinecap="round" />
            <path d="M286 19 L292 13" stroke="#C6A15B" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </div>

        {/* Friendly Greeting & One-Sentence Description */}
        <div className="mb-6">
          <h1 className="text-xl sm:text-2xl font-bold text-charcoal font-sans">
            {t.greeting_heading}
          </h1>
          <p className="text-xs sm:text-sm text-muted mt-2 leading-relaxed max-w-md mx-auto">
            {t.leaf_feature_sentence}
          </p>
        </div>

        {/* Large Primary Action & Voice Option */}
        <div className="space-y-3 mb-6">
          <button
            onClick={onStartScan}
            className="w-full py-4 px-6 rounded-natural bg-primary hover:bg-primary-dark active:scale-[0.99] text-cream font-bold text-base sm:text-lg shadow-elevated flex items-center justify-center space-x-3 transition-all cursor-pointer"
            id="check-my-crop-primary-btn"
          >
            <Camera className="w-6 h-6 text-cream flex-shrink-0" />
            <span>{t.check_my_crop}</span>
          </button>

          {onOpenVoiceAssistant && (
            <button
              onClick={onOpenVoiceAssistant}
              className="w-full py-3 px-4 rounded-natural bg-secondary/15 hover:bg-secondary/25 border border-secondary/30 text-secondary-dark font-semibold text-sm flex items-center justify-center space-x-2.5 transition-all cursor-pointer shadow-subtle"
              id="voice-assistant-hero-btn"
            >
              <div className="w-6 h-6 rounded-full bg-secondary text-cream flex items-center justify-center flex-shrink-0">
                <Mic className="w-3.5 h-3.5" />
              </div>
              <span>{t.voice_assistant_title} ({currentLang === 'en' ? 'Ask by Voice' : currentLang === 'te' ? 'నోటితో అడగండి' : 'बोलकर पूछें'})</span>
            </button>
          )}
        </div>

        {/* Secondary Actions (Clean & Accessible) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-4 border-t border-warmborder">
          
          {/* Previous Scans */}
          <button
            onClick={onOpenHistory}
            className="py-2.5 px-3.5 rounded-natural bg-ivory hover:bg-ivory-dark border border-warmborder text-charcoal text-xs font-semibold flex items-center justify-center space-x-2 transition-colors"
          >
            <History className="w-4 h-4 text-primary flex-shrink-0" />
            <span>{t.view_previous_scans}</span>
            {scanCount > 0 && (
              <span className="bg-primary text-cream text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                {scanCount}
              </span>
            )}
          </button>

          {/* Local Weather & Risk */}
          <button
            onClick={onOpenWeather}
            className="py-2.5 px-3.5 rounded-natural bg-ivory hover:bg-ivory-dark border border-warmborder text-charcoal text-xs font-semibold flex items-center justify-center space-x-2 transition-colors"
          >
            <CloudSun className="w-4 h-4 text-ochre flex-shrink-0" />
            <span>{weatherData ? `${weatherData.temperature}°C • ${t.weather_risk}` : t.weather_risk}</span>
          </button>

        </div>

      </div>

    </div>
  );
};
