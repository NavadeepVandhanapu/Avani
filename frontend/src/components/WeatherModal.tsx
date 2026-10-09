import React, { useState } from 'react';
import { CloudSun, X, Wind, Droplets, Thermometer, CloudRain, AlertTriangle, ShieldCheck } from 'lucide-react';
import type { Language, WeatherData } from '../types';
import { TRANSLATIONS } from '../translations';

interface WeatherModalProps {
  currentLang: Language;
  weatherData: WeatherData;
  onClose: () => void;
  onSelectLocation: (loc: string) => void;
}

export const WeatherModal: React.FC<WeatherModalProps> = ({
  currentLang,
  weatherData,
  onClose,
  onSelectLocation
}) => {
  const t = TRANSLATIONS[currentLang];
  const [selectedLoc, setSelectedLoc] = useState(weatherData.location);

  const handleLocationChange = (loc: string) => {
    setSelectedLoc(loc);
    onSelectLocation(loc);
  };

  const regions = weatherData.available_regions || [
    'Warangal, Telangana',
    'Guntur, Andhra Pradesh',
    'Nashik, Maharashtra',
    'Karnal, Haryana',
    'Shimla, Himachal Pradesh',
    'Varanasi, Uttar Pradesh'
  ];

  return (
    <div className="fixed inset-0 z-50 bg-charcoal/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-cream border border-warmborder rounded-card p-6 max-w-lg w-full shadow-elevated relative animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-warmborder">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-ivory text-ochre flex items-center justify-center">
              <CloudSun className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-primary font-sans">
                {t.weather_modal_title}
              </h3>
              <p className="text-xs text-muted">
                Source: {weatherData.source}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted hover:bg-ivory transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Region Selector */}
        <div className="my-4">
          <label className="block text-xs font-semibold text-charcoal mb-1.5">
            {t.switch_location}:
          </label>
          <select
            value={selectedLoc}
            onChange={(e) => handleLocationChange(e.target.value)}
            className="w-full px-3 py-2 rounded-natural border border-warmborder bg-ivory text-xs font-medium text-charcoal focus:ring-1 focus:ring-primary"
          >
            {regions.map((reg) => (
              <option key={reg} value={reg}>
                {reg}
              </option>
            ))}
          </select>
        </div>

        {/* Meteorological Parameters */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-5">
          <div className="p-3 rounded-natural bg-ivory border border-warmborder text-center">
            <Thermometer className="w-4 h-4 text-primary mx-auto mb-1" />
            <span className="text-[10px] text-muted block">{t.temperature}</span>
            <span className="text-sm font-bold text-charcoal">{weatherData.temperature}°C</span>
          </div>

          <div className="p-3 rounded-natural bg-ivory border border-warmborder text-center">
            <Droplets className="w-4 h-4 text-secondary mx-auto mb-1" />
            <span className="text-[10px] text-muted block">{t.humidity}</span>
            <span className="text-sm font-bold text-charcoal">{weatherData.humidity}%</span>
          </div>

          <div className="p-3 rounded-natural bg-ivory border border-warmborder text-center">
            <CloudRain className="w-4 h-4 text-ochre mx-auto mb-1" />
            <span className="text-[10px] text-muted block">{t.rain}</span>
            <span className="text-sm font-bold text-charcoal">{weatherData.rainfall_mm} mm</span>
          </div>

          <div className="p-3 rounded-natural bg-ivory border border-warmborder text-center">
            <Wind className="w-4 h-4 text-muted mx-auto mb-1" />
            <span className="text-[10px] text-muted block">{t.wind}</span>
            <span className="text-sm font-bold text-charcoal">{weatherData.wind_kmh} km/h</span>
          </div>
        </div>

        {/* Disease Risk Breakdown */}
        <div className="space-y-2.5 mb-5">
          <h4 className="text-xs font-bold text-charcoal flex items-center space-x-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-alert" />
            <span>{t.disease_pressure}:</span>
          </h4>

          {weatherData.disease_risk.risks.map((r, idx) => (
            <div key={idx} className="p-3 rounded-natural bg-ivory/80 border border-warmborder text-xs">
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-charcoal">{r.type}</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  r.level === 'High' ? 'bg-danger-light text-danger' :
                  r.level === 'Elevated' ? 'bg-alert-light text-alert' :
                  'bg-secondary/15 text-primary'
                }`}>
                  {r.level}
                </span>
              </div>
              <p className="text-[11px] text-muted leading-relaxed">{r.reason}</p>
            </div>
          ))}
        </div>

        {/* Advisory */}
        <div className="p-3 rounded-natural bg-secondary/10 border border-secondary/20 text-xs text-secondary-dark flex items-start space-x-2">
          <ShieldCheck className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <p>{weatherData.disease_risk.advisory}</p>
        </div>

        {/* Footer */}
        <div className="mt-5 text-right">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-natural bg-primary hover:bg-primary-dark text-cream font-medium text-xs shadow-subtle"
          >
            {t.btn_close}
          </button>
        </div>

      </div>
    </div>
  );
};
