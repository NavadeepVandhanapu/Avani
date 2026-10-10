import React from 'react';
import { Bell, X, Volume2, CloudRain, AlertTriangle, Clock } from 'lucide-react';
import type { Language, WeatherData } from '../types';
import { SpeechAssistant } from '../utils/speech';

export interface AlertNotification {
  id: string;
  type: 'weather' | 'disease' | 'timeline' | 'hygiene';
  severity: 'high' | 'medium' | 'info';
  timestamp: string;
  title: { en: string; te: string; hi: string };
  message: { en: string; te: string; hi: string };
  actionable: { en: string; te: string; hi: string };
}

export const REALTIME_NOTIFICATIONS: AlertNotification[] = [
  {
    id: 'notif_1',
    type: 'weather',
    severity: 'high',
    timestamp: 'Just now • Real-time',
    title: {
      en: 'Heavy Rain & Drainage Alert (Next 48 Hours)',
      te: 'భారీ వర్షం & నీటి పారుదల హెచ్చరిక (రాబోయే 48 గంటలు)',
      hi: 'भारी बारिश और जल निकासी चेतावनी (अगले 48 घंटे)'
    },
    message: {
      en: 'Heavy rain in 48 hours: delay fertilizer, drain the field.',
      te: 'రాబోయే 48 గంటల్లో భారీ వర్ష సూచన: ఎరువుల వాడకం వాయిదా వేయండి, పొలంలో నీటి పారుదల కాలువలను సరిచేయండి.',
      hi: 'अगले 48 घंटों में भारी बारिश की चेतावनी: उर्वरक का छिड़काव टालें, खेत से जल निकासी करें।'
    },
    actionable: {
      en: 'Avoid foliar sprays today to prevent chemical runoff and wasted inputs.',
      te: 'మందులు కొట్టవద్దు; నీటి ప్రవాహంలో కొట్టుకుపోయి వృథా అవుతాయి.',
      hi: 'दवा का छिड़काव न करें; बारिश से दवा बह जाएगी।'
    }
  },
  {
    id: 'notif_2',
    type: 'disease',
    severity: 'high',
    timestamp: '2 hours ago',
    title: {
      en: 'High Humidity & Fungal Blight Advisory',
      te: 'అధిక తేమ & శిలీంధ్ర తెగులు హెచ్చరిక',
      hi: 'अधिक नमी और फफूंद रोग चेतावनी'
    },
    message: {
      en: 'Morning relative humidity exceeds 80%: favorable conditions for early blight and late blight spore spread.',
      te: 'ఉదయం గాలిలో తేమ 80% దాటింది: ముందస్తు మరియు లేట్ బ్లైట్ తెగుళ్ళ వ్యాప్తికి అనుకూల వాతావరణం.',
      hi: 'सुबह की नमी 80% से अधिक है: झुलसा रोग (ब्लाइट) के बीजाणु तेजी से फैल सकते हैं।'
    },
    actionable: {
      en: 'Check lower canopy foliage for dark concentric ring spots.',
      te: 'మొక్కల కింది భాగంలోని ఆకులపై వలయాకార మచ్చలు ఉన్నాయేమో పరిశీలించండి.',
      hi: 'निचली पत्तियों पर गोल छल्लों वाले धब्बों की जांच करें।'
    }
  },
  {
    id: 'notif_3',
    type: 'timeline',
    severity: 'medium',
    timestamp: 'Today',
    title: {
      en: 'Crop Action Timeline Follow-up Check',
      te: 'పంట కార్యాచరణ కాలక్రమ పరిశీలన',
      hi: 'फसल कार्ययोजना अनुवर्ती जांच'
    },
    message: {
      en: 'Day 2 inspection reminder: Verify whether leaf lesions remain stationary or spread across rows.',
      te: '2వ రోజు తనిఖీ గుర్తుంపు: ఆకు మచ్చలు అక్కడే ఉన్నాయా లేదా పక్క మొక్కల సాల్లకు పాకుతున్నాయా చూడండి.',
      hi: 'दूसरे दिन की जांच: देखें कि क्या पत्ती के धब्बे वहीं सीमित हैं या अन्य कतारों में फैल रहे हैं।'
    },
    actionable: {
      en: 'Isolate severely infected leaves into bags; do not drop them in furrows.',
      te: 'తీవ్రంగా తెగులు సోకిన ఆకులను సంచిలో వేసి దూరంగా నాశనం చేయండి.',
      hi: 'अधिक संक्रमित पत्तियों को थैले में भरकर खेत से दूर नष्ट करें।'
    }
  },
  {
    id: 'notif_4',
    type: 'hygiene',
    severity: 'info',
    timestamp: 'Yesterday',
    title: {
      en: 'Field Hygiene & Tool Disinfection',
      te: 'పొలం పరిశుభ్రత & పరికరాల శుద్ధి',
      hi: 'खेत स्वच्छता और औजारों की सफाई'
    },
    message: {
      en: 'Avoid handling foliage while wet from dew to stop bacterial smear between plants.',
      te: 'మంచు తడి ఉన్నప్పుడు ఆకులను తాకవద్దు; బ్యాక్టీరియా పక్క మొక్కలకు వ్యాపించకుండా ఉండాలి.',
      hi: 'ओस से गीली पत्तियों को न छुएं, इससे बैक्टीरिया दूसरे पौधों में नहीं फैलेगा।'
    },
    actionable: {
      en: 'Clean pruning shears with clean water or mild detergent after working.',
      te: 'కత్తిరింపు పరికరాలను పరిశుభ్రమైన నీటితో కడిగి ఆరబెట్టండి.',
      hi: 'छंटाई के औजारों को साफ पानी से धोकर ही इस्तेमाल करें।'
    }
  }
];

interface NotificationsModalProps {
  currentLang: Language;
  weatherData?: WeatherData | null;
  onClose: () => void;
  onStartScan: () => void;
}

export const NotificationsModal: React.FC<NotificationsModalProps> = ({
  currentLang,
  weatherData,
  onClose,
  onStartScan
}) => {
  const handleReadAlert = (notif: AlertNotification) => {
    const text = `${notif.title[currentLang]}. ${notif.message[currentLang]}. ${notif.actionable[currentLang]}`;
    SpeechAssistant.speak(text, currentLang);
  };

  const labels = {
    en: {
      title: 'Real-Time Crop & Weather Notifications',
      subtitle: 'Dynamic alerts based on regional agro-meteorology and crop health timeline.',
      listenAll: 'Listen Aloud',
      scanCrop: 'Scan Affected Crop',
      close: 'Close',
      activeLocation: 'Live Weather Reference',
    },
    te: {
      title: 'పంట & వాతావరణ తాజా హెచ్చరికలు',
      subtitle: 'వాతావరణ మార్పులు మరియు పంట కాలక్రమం ఆధారంగా ప్రత్యక్ష సూచనలు.',
      listenAll: 'వాయిస్‌లో వినండి',
      scanCrop: 'పంటను తనిఖీ చేయండి',
      close: 'మూసివేయి',
      activeLocation: 'ప్రత్యక్ష వాతావరణం',
    },
    hi: {
      title: 'वास्तविक समय फसल व मौसम सूचनाएं',
      subtitle: 'मौसम की स्थिति और फसल कार्ययोजना पर आधारित त्वरित चेतावनियां।',
      listenAll: 'बोलकर सुनें',
      scanCrop: 'फसल की जांच करें',
      close: 'बंद करें',
      activeLocation: 'वर्तमान मौसम',
    }
  }[currentLang];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-charcoal/60 backdrop-blur-sm p-4 animate-fadeIn">
      <div 
        className="bg-cream border border-warmborder rounded-card max-w-xl w-full max-h-[90vh] flex flex-col shadow-elevated overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-warmborder bg-white flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-ochre/15 text-ochre flex items-center justify-center">
              <Bell className="w-5 h-5 text-ochre animate-bounce" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-primary font-sans">
                {labels.title}
              </h3>
              <p className="text-xs text-muted">
                {labels.subtitle}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted hover:bg-ivory transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Weather Reference Banner */}
        {weatherData && (
          <div className="px-5 py-2.5 bg-ivory/80 border-b border-warmborder flex items-center justify-between text-xs">
            <div className="flex items-center space-x-2">
              <CloudRain className="w-4 h-4 text-primary" />
              <span className="font-semibold text-charcoal">{weatherData.location}:</span>
              <span className="text-secondary-dark">{weatherData.temperature}°C • {weatherData.condition}</span>
            </div>
            <span className="text-[10px] bg-secondary/15 text-primary font-bold px-2 py-0.5 rounded-full">
              Live Feed
            </span>
          </div>
        )}

        {/* Notification Cards List */}
        <div className="p-5 overflow-y-auto space-y-3.5 flex-1">
          {REALTIME_NOTIFICATIONS.map((notif) => {
            const isHigh = notif.severity === 'high';
            return (
              <div
                key={notif.id}
                className={`p-4 rounded-natural border transition-all ${
                  isHigh
                    ? 'bg-ochre/5 border-ochre/30 shadow-subtle'
                    : 'bg-white border-warmborder'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <div className="flex items-center space-x-2">
                    {isHigh ? (
                      <AlertTriangle className="w-4 h-4 text-ochre flex-shrink-0" />
                    ) : (
                      <Clock className="w-4 h-4 text-secondary flex-shrink-0" />
                    )}
                    <h4 className="text-xs sm:text-sm font-bold text-charcoal">
                      {notif.title[currentLang]}
                    </h4>
                  </div>

                  <div className="flex items-center space-x-1 flex-shrink-0">
                    <button
                      onClick={() => handleReadAlert(notif)}
                      className="p-1.5 rounded-md hover:bg-ivory text-primary transition-colors cursor-pointer"
                      title={labels.listenAll}
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-[10px] text-muted font-medium ml-1">
                      {notif.timestamp}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-charcoal-muted font-medium leading-relaxed pl-6">
                  {notif.message[currentLang]}
                </p>

                <div className="mt-2.5 ml-6 pt-2 border-t border-warmborder/60 text-[11px] text-secondary-dark font-medium flex items-center space-x-1.5">
                  <span className="font-bold text-primary">👉 Action:</span>
                  <span>{notif.actionable[currentLang]}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-warmborder bg-white flex items-center justify-between gap-3">
          <button
            onClick={() => {
              onClose();
              onStartScan();
            }}
            className="px-4 py-2 rounded-natural bg-primary hover:bg-primary-dark text-cream font-bold text-xs sm:text-sm shadow-subtle flex items-center space-x-1.5 cursor-pointer"
          >
            <span>{labels.scanCrop}</span>
          </button>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-natural border border-warmborder text-charcoal hover:bg-ivory text-xs font-semibold cursor-pointer"
          >
            {labels.close}
          </button>
        </div>

      </div>
    </div>
  );
};
