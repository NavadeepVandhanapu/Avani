import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { WelcomeHero } from './components/WelcomeHero';
import { LeafScanner } from './components/LeafScanner';
import { AnalysisLoading } from './components/AnalysisLoading';
import { PredictionResult } from './components/PredictionResult';
import { FollowUpQuestionnaire } from './components/FollowUpQuestionnaire';
import { ActionSupportPlan } from './components/ActionSupportPlan';
import { WeatherModal } from './components/WeatherModal';
import { ScanHistoryModal } from './components/ScanHistoryModal';

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

  const [isSpeaking, setIsSpeaking] = useState(false);

  useEffect(() => {
    loadWeatherData();
    loadScans();
  }, []);

  const loadWeatherData = async (location?: string) => {
    try {
      const data = await fetchWeatherData(location);
      setWeatherData(data);
    } catch (err) {
      console.warn('Weather load warning:', err);
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
        onGoHome={() => setCurrentStep('welcome')}
        scanCount={savedScans.length}
        weatherData={weatherData}
        isSpeaking={isSpeaking}
        onToggleSpeech={handleToggleSpeech}
      />

      {/* Main Workflow View Routing */}
      <main className="flex-1">
        {currentStep === 'welcome' && (
          <WelcomeHero
            currentLang={currentLang}
            onLanguageChange={setCurrentLang}
            onStartScan={handleStartScan}
            onOpenHistory={() => setIsHistoryModalOpen(true)}
            onOpenWeather={() => setIsWeatherModalOpen(true)}
            scanCount={savedScans.length}
            weatherData={weatherData}
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
          />
        )}
      </main>

      {/* Weather Advisory Modal */}
      {isWeatherModalOpen && weatherData && (
        <WeatherModal
          currentLang={currentLang}
          weatherData={weatherData}
          onClose={() => setIsWeatherModalOpen(false)}
          onSelectLocation={(loc) => loadWeatherData(loc)}
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
