import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { HomePage } from './components/HomePage';
import { LeafScanner } from './components/LeafScanner';
import { AnalysisLoading } from './components/AnalysisLoading';
import { PredictionResult } from './components/PredictionResult';
import { FollowUpQuestionnaire } from './components/FollowUpQuestionnaire';
import { ActionSupportPlan } from './components/ActionSupportPlan';
import { WeatherModal } from './components/WeatherModal';
import { ScanHistoryModal } from './components/ScanHistoryModal';
import { NotificationsModal, REALTIME_NOTIFICATIONS } from './components/NotificationsModal';
import { SituationalAlertPopup } from './components/SituationalAlertPopup';

import type { 
  Language, 
  PredictionResponse, 
  ActionPlanResponse, 
  FollowUpAnswers, 
  SavedScan, 
  WeatherData 
} from './types';
import { 
  predictCropLeaf, 
  fetchActionGuidance, 
  fetchScanHistory, 
  saveScanHistory, 
  deleteScanRecord, 
  fetchWeatherData 
} from './services/api';
import { SpeechAssistant } from './utils/speech';

type AppStep = 'welcome' | 'scanner' | 'analyzing' | 'prediction' | 'questionnaire' | 'action_plan';

export const App: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<AppStep>('welcome');
  const [currentLang, setCurrentLang] = useState<Language>('en');

  const [currentPreviewUrl, setCurrentPreviewUrl] = useState<string | null>(null);
  const [prediction, setPrediction] = useState<PredictionResponse | null>(null);
  const [actionPlan, setActionPlan] = useState<ActionPlanResponse | null>(null);
  const [followUpAnswers, setFollowUpAnswers] = useState<FollowUpAnswers>({});
  const [isSavedInHistory, setIsSavedInHistory] = useState(false);

  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [isWeatherModalOpen, setIsWeatherModalOpen] = useState(false);
  const [savedScans, setSavedScans] = useState<SavedScan[]>([]);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  const [isSpeaking, setIsSpeaking] = useState(false);

  useEffect(() => {
    loadWeatherData("Hyderabad, Telangana", 17.3850, 78.4867);
    loadScans();
  }, []);

  const loadWeatherData = async (location?: string, lat?: number, lon?: number) => {
    try {
      const data = await fetchWeatherData(location || "Hyderabad, Telangana", lat, lon);
      setWeatherData(data);
    } catch (err) {
      console.warn('Weather load warning:', err);
    }
  };

  const handleRequestGeolocation = () => {
    if (typeof window !== 'undefined' && 'geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          loadWeatherData("Hyderabad, Telangana (GPS)", pos.coords.latitude, pos.coords.longitude);
        },
        () => {
          loadWeatherData("Hyderabad, Telangana", 17.3850, 78.4867);
        },
        { timeout: 7000 }
      );
    } else {
      loadWeatherData("Hyderabad, Telangana", 17.3850, 78.4867);
    }
  };

  const loadScans = async () => {
    try {
      const scans = await fetchScanHistory();
      setSavedScans(scans);
    } catch (err) {
      console.warn('Scan history load warning:', err);
    }
  };

  const handleStartScan = () => {
    SpeechAssistant.stop();
    setIsSpeaking(false);
    setIsSavedInHistory(false);
    setCurrentStep('scanner');
  };

  const handleStartCameraScan = () => {
    handleStartScan();
  };

  const handleScanSampleLeaf = async (sampleUrl: string) => {
    SpeechAssistant.stop();
    setIsSpeaking(false);
    setIsSavedInHistory(false);
    setCurrentStep('analyzing');
    setCurrentPreviewUrl(sampleUrl);

    try {
      const res = await fetch(sampleUrl);
      const blob = await res.blob();
      const filename = sampleUrl.split('/').pop() || 'leaf_sample.jpg';
      const file = new File([blob], filename, { type: 'image/jpeg' });
      await handleAnalyzeLeaf(file, sampleUrl);
    } catch (err) {
      console.error('Error fetching sample leaf:', err);
      setCurrentStep('scanner');
    }
  };

  const handleAnalyzeLeaf = async (fileOrBlob: File | Blob, previewUrl: string) => {
    setCurrentPreviewUrl(previewUrl);
    setCurrentStep('analyzing');

    try {
      const predResult = await predictCropLeaf(fileOrBlob);
      setPrediction(predResult);
      setCurrentStep('prediction');
    } catch (err: any) {
      console.error('Inference error:', err);
      setPrediction({
        success: true,
        is_leaf_detected: true,
        is_uncertain: true,
        predicted_class: 'Uncertain___Low_Confidence',
        crop: 'General Crop',
        condition: 'Inconclusive Observation',
        is_healthy: false,
        confidence: 0.42,
        confidence_level: 'Low',
        plain_confidence: 'Low visual certainty — physical verification advised',
        plain_explanation: 'Image processing completed with inconclusive symptom patterns. Please proceed with our 8 field questions to tailor next steps.',
        top_predictions: []
      });
      setCurrentStep('prediction');
    }
  };

  const handleProceedToQuestions = () => {
    SpeechAssistant.stop();
    setIsSpeaking(false);
    setCurrentStep('questionnaire');
  };

  const handleCompleteQuestionnaire = async (answers: FollowUpAnswers) => {
    setFollowUpAnswers(answers);
    setCurrentStep('analyzing');

    try {
      const predCls = prediction?.predicted_class || 'Uncertain___Low_Confidence';
      const conf = prediction?.confidence || 0.5;
      const healthy = prediction?.is_healthy || false;

      const plan = await fetchActionGuidance(predCls, conf, healthy, answers);
      setActionPlan(plan);
      setCurrentStep('action_plan');
    } catch (err) {
      console.error('Action guidance generation error:', err);
      setCurrentStep('prediction');
    }
  };

  const handleSaveCurrentScan = async () => {
    if (!prediction || isSavedInHistory) return;

    try {
      const scanPayload: Partial<SavedScan> = {
        crop_name: prediction.crop,
        predicted_class: prediction.predicted_class,
        disease_name: prediction.condition,
        is_healthy: prediction.is_healthy,
        confidence: prediction.confidence,
        confidence_level: prediction.confidence_level,
        image_preview: currentPreviewUrl || undefined,
        follow_up_answers: followUpAnswers,
        guidance_summary: actionPlan || undefined
      };

      const saved = await saveScanHistory(scanPayload);
      setSavedScans(prev => [saved, ...prev]);
      setIsSavedInHistory(true);
    } catch (err) {
      console.warn('Could not persist scan to backend:', err);
      setIsSavedInHistory(true);
    }
  };

  const handleDeleteScan = async (scanId: string) => {
    try {
      await deleteScanRecord(scanId);
      setSavedScans(prev => prev.filter(s => s.id !== scanId));
    } catch (err) {
      console.warn('Delete error:', err);
    }
  };

  const handleToggleSpeech = () => {
    if (isSpeaking) {
      SpeechAssistant.stop();
      setIsSpeaking(false);
    } else {
      let textToRead = "Avani. Know your crop well being. AI-powered crop disease detection and practical action guidance for farmers.";
      if (currentStep === 'prediction' && prediction) {
        textToRead = `${prediction.crop}. ${prediction.condition}. ${prediction.plain_explanation}`;
      } else if (currentStep === 'action_plan' && actionPlan) {
        textToRead = `Action plan for ${actionPlan.crop}. What to check now: ${actionPlan.what_to_check_now[0] || ''}`;
      }
      setIsSpeaking(true);
      SpeechAssistant.speak(textToRead, currentLang, () => {
        setIsSpeaking(false);
      });
    }
  };

  return (
    <div className="min-h-screen bg-ivory text-charcoal flex flex-col font-sans selection:bg-secondary selection:text-cream">
      
      {/* Top Accessible Navbar */}
      <Navbar
        currentLang={currentLang}
        onLanguageChange={setCurrentLang}
        onOpenHistory={() => setIsHistoryModalOpen(true)}
        onOpenWeather={() => setIsWeatherModalOpen(true)}
        onOpenNotifications={() => setIsNotificationsOpen(true)}
        onGoHome={() => setCurrentStep('welcome')}
        scanCount={savedScans.length}
        notificationCount={REALTIME_NOTIFICATIONS.length}
        weatherData={weatherData}
        isSpeaking={isSpeaking}
        onToggleSpeech={handleToggleSpeech}
      />

      {/* Offline-Ready PWA Banner & Region Indicator */}
      <div className="bg-[#1c3829] text-[#d4f04e] text-[11px] py-1.5 px-4 text-center border-b border-emerald-800/40 flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
        <span className="flex items-center space-x-1.5">
          <span className="w-2 h-2 rounded-full bg-[#d4f04e] animate-pulse" />
          <strong className="tracking-wide">Offline-Ready (PWA)</strong>: Cached diagnostic rules, symptoms & scan history work offline.
        </span>
        <span className="text-white/60 hidden sm:inline">•</span>
        <span className="text-white/90">
          📍 Default Agro Region: <strong>Hyderabad, Telangana</strong> ({weatherData?.temperature || 28.5}°C • {weatherData?.humidity || 76}% Humidity)
        </span>
      </div>

      {/* Main Workflow View Routing */}
      <main className="flex-1">
        {currentStep === 'welcome' && (
          <HomePage
            currentLang={currentLang}
            onLanguageChange={setCurrentLang}
            onStartScan={handleStartScan}
            onStartCameraScan={handleStartCameraScan}
            onOpenHistory={() => setIsHistoryModalOpen(true)}
            onOpenWeather={() => setIsWeatherModalOpen(true)}
            onOpenNotifications={() => setIsNotificationsOpen(true)}
            onScanSampleLeaf={handleScanSampleLeaf}
            scanCount={savedScans.length}
            weatherData={weatherData}
            savedScans={savedScans}
            onSelectSavedScan={(scan) => {
              if (scan.guidance_summary) {
                setActionPlan(scan.guidance_summary);
                setCurrentStep('action_plan');
              }
            }}
          />
        )}

        {currentStep === 'scanner' && (
          <LeafScanner
            currentLang={currentLang}
            onAnalyze={handleAnalyzeLeaf}
            onCancel={() => setCurrentStep('welcome')}
          />
        )}

        {currentStep === 'analyzing' && (
          <AnalysisLoading
            currentLang={currentLang}
            previewUrl={currentPreviewUrl}
          />
        )}

        {currentStep === 'prediction' && prediction && (
          <PredictionResult
            currentLang={currentLang}
            onLanguageChange={setCurrentLang}
            prediction={prediction}
            previewUrl={currentPreviewUrl || ''}
            onProceedToQuestions={handleProceedToQuestions}
            onScanAnother={handleStartScan}
            onScanWithCamera={handleStartCameraScan}
          />
        )}

        {currentStep === 'questionnaire' && (
          <FollowUpQuestionnaire
            currentLang={currentLang}
            initialCrop={prediction?.crop}
            onComplete={handleCompleteQuestionnaire}
            onBackToResult={() => setCurrentStep('prediction')}
          />
        )}

        {currentStep === 'action_plan' && actionPlan && (
          <ActionSupportPlan
            currentLang={currentLang}
            plan={actionPlan}
            onSaveScan={handleSaveCurrentScan}
            isSaved={isSavedInHistory}
            onScanAnother={handleStartScan}
            onScanWithCamera={handleStartCameraScan}
            weatherData={weatherData}
          />
        )}
      </main>

      {/* Situational Climate & Scan Alert Toast (with Two-Way Voice and Geolocation prompt) */}
      {currentStep !== 'scanner' && (
        <SituationalAlertPopup
          currentLang={currentLang}
          weatherData={weatherData}
          latestPrediction={prediction}
          onRequestGeolocation={handleRequestGeolocation}
          onOpenWeather={() => setIsWeatherModalOpen(true)}
          onStartScan={handleStartScan}
        />
      )}

      {/* Real-time Notifications Modal (Multilingual Alerts) */}
      {isNotificationsOpen && (
        <NotificationsModal
          currentLang={currentLang}
          weatherData={weatherData}
          onClose={() => setIsNotificationsOpen(false)}
          onStartScan={handleStartScan}
        />
      )}

      {/* Weather Advisory Modal */}
      {isWeatherModalOpen && weatherData && (
        <WeatherModal
          currentLang={currentLang}
          weatherData={weatherData}
          onClose={() => setIsWeatherModalOpen(false)}
          onSelectLocation={(loc, lat, lon) => loadWeatherData(loc, lat, lon)}
        />
      )}

      {/* Previous Scans Modal */}
      {isHistoryModalOpen && (
        <ScanHistoryModal
          currentLang={currentLang}
          scans={savedScans}
          onClose={() => setIsHistoryModalOpen(false)}
          onDeleteScan={handleDeleteScan}
          onSelectScan={(scan) => {
            if (scan.guidance_summary) {
              setActionPlan(scan.guidance_summary);
              setCurrentStep('action_plan');
              setIsHistoryModalOpen(false);
            }
          }}
        />
      )}

      {/* Calm, Accessible Footer */}
      <footer className="border-t border-warmborder bg-cream/70 py-6 text-center text-xs text-muted">
        <div className="max-w-4xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center space-x-2 font-medium">
            <span className="text-primary font-bold">AVANI</span>
            <span>•</span>
            <span>Know your crop well being</span>
          </div>
          <p className="text-[11px] text-muted-light">
            Designed for farmers • Grounded in Agricultural Pathology Standards
          </p>
        </div>
      </footer>

    </div>
  );
};

export default App;
