import React from 'react';
import { Camera, History, CloudSun, Globe } from 'lucide-react';
import type { Language, WeatherData } from '../types';
import { TRANSLATIONS } from '../translations';

interface WelcomeHeroProps {
  currentLang: Language;
  onLanguageChange: (lang: Language) => void;
  onStartScan: () => void;
  onOpenHistory: () => void;
  onOpenWeather: () => void;
  scanCount: number;
  weatherData?: WeatherData | null;
}

export const WelcomeHero: React.FC<WelcomeHeroProps> = ({
  currentLang,
  onLanguageChange,
  onStartScan,
  onOpenHistory,
  onOpenWeather,
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
        <div className="mb-6 flex flex-col items-center">
          <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-3xl bg-white p-3 border border-warmborder shadow-card flex items-center justify-center mb-4 hover:shadow-elevated transition-all">
            <img 
              src="/logo.png" 
              alt="Avani - Know your crop well being" 
              className="w-full h-full object-contain rounded-2xl" 
            />
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-primary font-sans">
            {t.app_title}
          </h2>
          <p className="text-sm sm:text-base text-secondary-dark font-medium mt-1">
            “{t.tagline}”
          </p>
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

        {/* Large Primary Action */}
        <div className="mb-6">
          <button
            onClick={onStartScan}
            className="w-full py-4 px-6 rounded-natural bg-primary hover:bg-primary-dark active:scale-[0.99] text-cream font-bold text-base sm:text-lg shadow-elevated flex items-center justify-center space-x-3 transition-all cursor-pointer"
            id="check-my-crop-primary-btn"
          >
            <Camera className="w-6 h-6 text-cream flex-shrink-0" />
            <span>{t.check_my_crop}</span>
          </button>
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
