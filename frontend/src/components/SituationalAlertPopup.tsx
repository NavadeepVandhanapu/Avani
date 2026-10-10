import React, { useState, useEffect } from 'react';
import { Bell, X, Volume2, MapPin, AlertTriangle, ArrowRight } from 'lucide-react';
import type { Language, WeatherData, PredictionResponse } from '../types';
import { SpeechAssistant } from '../utils/speech';

interface SituationalAlertPopupProps {
  currentLang: Language;
  weatherData: WeatherData | null;
  latestPrediction: PredictionResponse | null;
  onRequestGeolocation: () => void;
  onOpenWeather: () => void;
  onStartScan: () => void;
}

export const SituationalAlertPopup: React.FC<SituationalAlertPopupProps> = ({
  currentLang,
  weatherData,
  latestPrediction,
  onRequestGeolocation,
  onOpenWeather,
  onStartScan
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [hasPromptedGeo, setHasPromptedGeo] = useState(false);

  // Show situational alert on initial load or when weather/prediction updates
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 1800);
    return () => clearTimeout(timer);
  }, []);

  // When a new scan occurs, pop up situational alert correlated with climate
  useEffect(() => {
    if (latestPrediction) {
      setIsVisible(true);
    }
  }, [latestPrediction]);

  if (!isVisible) return null;

  const isScanAlert = !!latestPrediction;
  const currentTemp = weatherData?.temperature ?? 28.5;
  const currentHumidity = weatherData?.humidity ?? 76;
  const locationName = weatherData?.location || "Hyderabad, Telangana";

  // Multilingual alert content
  const alertContent = {
    en: {
      climateHeader: `Agro Climate Alert • ${locationName}`,
      climateBody: `${currentTemp}°C & ${currentHumidity}% Humidity. High moisture index promotes fungal spore germination in solanaceous crops.`,
      scanHeader: `Field Threat Correlation • ${latestPrediction?.crop}`,
      scanBody: `${latestPrediction?.condition} detected. At ${currentHumidity}% humidity, secondary foliar transmission is accelerated. Avoid working on wet foliage today.`,
      listenBtn: "Listen Aloud",
      gpsBtn: "Enable GPS",
      viewBtn: "View Advisory",
      scanBtn: "Scan Leaf Now"
    },
    te: {
      climateHeader: `వ్యవసాయ వాతావరణ హెచ్చరిక • ${locationName}`,
      climateBody: `${currentTemp}°C ఉష్ణోగ్రత & ${currentHumidity}% తేమ. అధిక తేమ వల్ల టమోటా, బంగాళాదుంప పంటలలో శిలీంధ్ర తెగుళ్ళ వ్యాప్తి పెరుగుతుంది.`,
      scanHeader: `పంట తెగులు పరిస్థితి • ${latestPrediction?.crop}`,
      scanBody: `${latestPrediction?.condition} గుర్తించబడింది. ${currentHumidity}% తేమ వల్ల తెగులు వేగంగా పాకుతుంది. తడి ఆకులను తాకవద్దు.`,
      listenBtn: "వినండి",
      gpsBtn: "GPS ఆన్ చేయండి",
      viewBtn: "వివరాలు",
      scanBtn: "స్కాన్ చేయండి"
    },
    hi: {
      climateHeader: `कृषि मौसम चेतावनी • ${locationName}`,
      climateBody: `${currentTemp}°C तापमान व ${currentHumidity}% नमी। अधिक नमी से टमाटर व आलू की फसलों में फफूंद जनित बीमारियों का खतरा अधिक है।`,
      scanHeader: `फसल स्थिति चेतावनी • ${latestPrediction?.crop}`,
      scanBody: `${latestPrediction?.condition} के लक्षण दिखे। ${currentHumidity}% नमी में रोग तेजी से फैल सकता है। गीली पत्तियों को न छुएं।`,
      listenBtn: "सुनें",
      gpsBtn: "GPS ऑन करें",
      viewBtn: "विवरण",
      scanBtn: "स्कैन करें"
    }
  }[currentLang];

  const handleSpeak = () => {
    const textToRead = isScanAlert 
      ? `${alertContent.scanHeader}. ${alertContent.scanBody}`
      : `${alertContent.climateHeader}. ${alertContent.climateBody}`;
    SpeechAssistant.speak(textToRead, currentLang);
  };

  const handleGeoClick = () => {
    setHasPromptedGeo(true);
    onRequestGeolocation();
  };

  return (
    <div className="fixed bottom-5 right-4 sm:right-6 z-50 max-w-sm sm:max-w-md w-full animate-bounceIn">
      <div className="bg-charcoal/95 backdrop-blur-xl border-2 border-[#d4f04e] rounded-2xl p-4 shadow-2xl text-cream flex flex-col space-y-3">
        
        {/* Top Header Row */}
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-2.5">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
              isScanAlert ? 'bg-amber-500/20 text-amber-400' : 'bg-[#d4f04e]/20 text-[#d4f04e]'
            }`}>
              {isScanAlert ? <AlertTriangle className="w-4 h-4 animate-pulse" /> : <Bell className="w-4 h-4 animate-bounce" />}
            </div>
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#d4f04e] block">
                {isScanAlert ? "Immediate Field Correlation" : "Situational Agro Notification"}
              </span>
              <h4 className="text-xs sm:text-sm font-bold text-white flex items-center space-x-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#d4f04e]" />
                <span>{isScanAlert ? alertContent.scanHeader : alertContent.climateHeader}</span>
              </h4>
            </div>
          </div>

          <button
            onClick={() => setIsVisible(false)}
            className="text-cream/60 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
            title="Dismiss popup"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Message Body */}
        <p className="text-xs text-cream/90 leading-relaxed font-medium">
          {isScanAlert ? alertContent.scanBody : alertContent.climateBody}
        </p>

        {/* Action Controls & Two-way Voice */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-white/15">
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={handleSpeak}
              className="px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-bold flex items-center space-x-1.5 cursor-pointer transition-all border border-white/20"
              title="Listen aloud in your selected language"
            >
              <Volume2 className="w-3.5 h-3.5 text-[#d4f04e]" />
              <span>{alertContent.listenBtn}</span>
            </button>

            {!hasPromptedGeo && (
              <button
                type="button"
                onClick={handleGeoClick}
                className="px-2.5 py-1.5 rounded-lg bg-[#d4f04e]/20 hover:bg-[#d4f04e]/30 text-[#d4f04e] text-xs font-bold flex items-center space-x-1 cursor-pointer transition-all border border-[#d4f04e]/40"
              >
                <MapPin className="w-3 h-3" />
                <span>{alertContent.gpsBtn}</span>
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={isScanAlert ? onOpenWeather : onStartScan}
            className="px-3.5 py-1.5 rounded-lg bg-[#d4f04e] hover:bg-[#c2e23b] text-gray-950 text-xs font-extrabold flex items-center space-x-1 cursor-pointer transition-all shadow-md ml-auto"
          >
            <span>{isScanAlert ? alertContent.viewBtn : alertContent.scanBtn}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>
    </div>
  );
};
