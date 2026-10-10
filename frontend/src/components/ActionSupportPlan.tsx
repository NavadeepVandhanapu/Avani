import React, { useState, useEffect } from 'react';
import { 
  Eye, 
  ShieldCheck, 
  Bookmark, 
  RotateCcw, 
  Volume2, 
  VolumeX, 
  CheckSquare, 
  Square, 
  Building2, 
  Clock, 
  FileCheck2,
  Printer
} from 'lucide-react';
import type { Language, ActionPlanResponse, TimelineActionItem } from '../types';
import { TRANSLATIONS } from '../translations';
import { SpeechAssistant } from '../utils/speech';

interface ActionSupportPlanProps {
  currentLang: Language;
  plan: ActionPlanResponse;
  onSaveScan: () => void;
  isSaved: boolean;
  onScanAnother: () => void;
  weatherData?: any;
}

export const ActionSupportPlan: React.FC<ActionSupportPlanProps> = ({
  currentLang,
  plan,
  onSaveScan,
  isSaved,
  onScanAnother,
  weatherData
}) => {
  const t = TRANSLATIONS[currentLang];

  const [tasks, setTasks] = useState<TimelineActionItem[]>(plan.timeline_actions || []);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);

  // Sync tasks when plan changes (e.g. language toggle or new scan)
  useEffect(() => {
    setTasks(plan.timeline_actions || []);
  }, [plan]);

  const toggleTask = (id: string) => {
    setTasks(prev => prev.map(item => 
      item.id === id ? { ...item, completed: !item.completed } : item
    ));
  };

  const handleReadFullPlan = () => {
    if (isAudioPlaying) {
      SpeechAssistant.stop();
      setIsAudioPlaying(false);
      return;
    }

    const checkNowText = plan.what_to_check_now.join('. ');
    const monitorText = plan.what_to_monitor.join('. ');
    const seekHelpText = plan.when_to_seek_help.join('. ');
    
    let speech = '';
    if (currentLang === 'te') {
      speech = `${plan.crop} - ${plan.condition} కార్యాచరణ ప్రణాళిక. 1. ఇప్పుడు ఏం పరిశీలించాలి: ${checkNowText}. 2. ఏమి గమనించాలి: ${monitorText}. 3. వ్యవసాయ అధికారిని ఎప్పుడు సంప్రదించాలి: ${seekHelpText}.`;
    } else if (currentLang === 'hi') {
      speech = `${plan.crop} - ${plan.condition} कार्य योजना। 1. अभी क्या जांचें: ${checkNowText}। 2. क्या निगरानी करें: ${monitorText}। 3. विशेषज्ञ से कब संपर्क करें: ${seekHelpText}।`;
    } else {
      speech = `Action plan for ${plan.crop}, ${plan.condition}. First, What to check now: ${checkNowText}. Second, What to monitor: ${monitorText}. Third, When to seek help: ${seekHelpText}.`;
    }
    
    setIsAudioPlaying(true);
    SpeechAssistant.speak(speech, currentLang, () => {
      setIsAudioPlaying(false);
    });
  };

  const completedCount = tasks.filter(t => t.completed).length;

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-1.5 text-xs font-semibold text-primary px-2.5 py-0.5 rounded-full bg-secondary/15 border border-secondary/20 mb-1.5">
            <FileCheck2 className="w-3.5 h-3.5 text-secondary-dark" />
            <span>{t.plan_badge || "Factual Agricultural Action Plan"}</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-primary font-sans">
            {t.plan_heading}
          </h2>
          <p className="text-xs sm:text-sm text-muted mt-0.5">
            {t.plan_subheading}
          </p>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center space-x-2">
          
          <button
            onClick={handleReadFullPlan}
            className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-natural border text-xs font-semibold shadow-subtle transition-all cursor-pointer ${
              isAudioPlaying 
                ? 'bg-primary text-cream border-primary animate-pulse' 
                : 'bg-cream border-warmborder hover:bg-ivory text-charcoal'
            }`}
            title={isAudioPlaying ? t.btn_stop_tts : t.btn_listen_tts}
          >
            {isAudioPlaying ? <VolumeX className="w-4 h-4 text-cream" /> : <Volume2 className="w-4 h-4 text-primary" />}
            <span>{isAudioPlaying ? t.btn_stop_tts : t.btn_listen_tts}</span>
          </button>

          <button
            onClick={onSaveScan}
            disabled={isSaved}
            className={`flex items-center space-x-1.5 px-4 py-2 rounded-natural text-xs font-semibold shadow-subtle transition-all cursor-pointer ${
              isSaved 
                ? 'bg-secondary/20 text-secondary-dark border border-secondary/30 cursor-default' 
                : 'bg-primary hover:bg-primary-dark text-cream'
            }`}
            id="save-scan-history-btn"
          >
            <Bookmark className="w-4 h-4" />
            <span>{isSaved ? t.btn_saved_done : t.btn_save_scan}</span>
          </button>

          <button
            onClick={() => window.print()}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-natural border border-warmborder bg-cream hover:bg-ivory text-charcoal text-xs font-semibold shadow-subtle cursor-pointer"
            title="Print or Save Action Card"
          >
            <Printer className="w-4 h-4 text-primary" />
            <span className="hidden sm:inline">Print Card</span>
          </button>

        </div>
      </div>

      {/* Summary Chips */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-5">
        {plan.summary_bullets?.map((bullet, idx) => (
          <div key={idx} className="p-2.5 rounded-natural bg-ivory border border-warmborder text-[11px] font-medium text-charcoal">
            {bullet}
          </div>
        ))}
      </div>

      {/* Agro-Meteorological Weather & Soil Alert (Slide 3 & 5) */}
      <div className="mb-5 p-4 rounded-natural bg-ochre/10 border border-ochre/30 flex items-start space-x-3 text-xs shadow-subtle">
        <span className="text-xl flex-shrink-0">⛅</span>
        <div>
          <span className="font-bold text-charcoal block text-xs sm:text-sm">
            🌾 Agro-Meteorological Advisory {weatherData ? `(${weatherData.location} • ${weatherData.temperature}°C • ${weatherData.condition})` : ''}
          </span>
          <p className="text-secondary-dark mt-1 leading-relaxed">
            {weatherData?.rainfall_mm > 0 || weatherData?.humidity > 75 
              ? "⚠️ High moisture detected: Delay foliar fertilizer application, ensure field drainage furrows are cleared, and avoid handling plants while leaves are wet to prevent spreading spores."
              : "⚠️ Field Weather Alert: In case of rain forecast in next 48 hours, delay chemical/fertilizer spray and verify soil drainage channels."}
          </p>
        </div>
      </div>

      {/* Section 1: What to Check Now */}
      <div className="bg-cream border border-warmborder rounded-card p-6 shadow-card mb-5">
        <div className="flex items-center space-x-2.5 mb-4 pb-3 border-b border-warmborder">
          <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
            1
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-primary font-sans">
              {t.check_now_heading}
            </h3>
            <p className="text-xs text-muted">{t.check_now_subtitle || "Immediate physical inspection steps on foliage and soil"}</p>
          </div>
        </div>

        <ul className="space-y-3">
          {plan.what_to_check_now.map((item, idx) => (
            <li key={idx} className="flex items-start space-x-3 text-xs sm:text-sm text-charcoal">
              <span className="w-5 h-5 rounded-full bg-ivory border border-warmborder flex items-center justify-center font-bold text-[11px] text-primary mt-0.5 flex-shrink-0">
                {idx + 1}
              </span>
              <span className="leading-relaxed">{item}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Section 2: What to Monitor */}
      <div className="bg-cream border border-warmborder rounded-card p-6 shadow-card mb-5">
        <div className="flex items-center space-x-2.5 mb-4 pb-3 border-b border-warmborder">
          <div className="w-8 h-8 rounded-xl bg-ochre/15 text-ochre-dark flex items-center justify-center font-bold text-sm">
            2
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-primary font-sans">
              {t.monitor_heading}
            </h3>
            <p className="text-xs text-muted">{t.monitor_subtitle || "Observation indicators for symptom expansion over next 2 to 5 days"}</p>
          </div>
        </div>

        <ul className="space-y-3">
          {plan.what_to_monitor.map((item, idx) => (
            <li key={idx} className="flex items-start space-x-3 text-xs sm:text-sm text-charcoal">
              <Eye className="w-4 h-4 text-ochre mt-0.5 flex-shrink-0" />
              <span className="leading-relaxed">{item}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Section 3: When to Seek Help */}
      <div className="bg-cream border border-warmborder rounded-card p-6 shadow-card mb-5">
        <div className="flex items-center space-x-2.5 mb-4 pb-3 border-b border-warmborder">
          <div className="w-8 h-8 rounded-xl bg-danger-light text-danger flex items-center justify-center font-bold text-sm">
            3
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-primary font-sans">
              {t.seek_help_heading}
            </h3>
            <p className="text-xs text-muted">{t.seek_help_subtitle || "Thresholds for escalating to local agricultural extension (KVK)"}</p>
          </div>
        </div>

        <ul className="space-y-3">
          {plan.when_to_seek_help.map((item, idx) => (
            <li key={idx} className="flex items-start space-x-3 text-xs sm:text-sm text-charcoal">
              <Building2 className="w-4 h-4 text-danger mt-0.5 flex-shrink-0" />
              <span className="leading-relaxed">{item}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Section 4: Interactive Action Timeline / Checklist */}
      <div className="bg-cream border border-warmborder rounded-card p-6 shadow-card mb-6">
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-warmborder">
          <div className="flex items-center space-x-2">
            <Clock className="w-5 h-5 text-primary" />
            <h3 className="text-base sm:text-lg font-bold text-primary font-sans">
              {t.timeline_heading}
            </h3>
          </div>
          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-ivory border border-warmborder text-secondary-dark">
            {completedCount} / {tasks.length} {t.completed_label || "Completed"}
          </span>
        </div>

        {/* Visual Action TIMELINE Stepper (Slide 3 & 4) */}
        <div className="grid grid-cols-3 gap-2 mb-5 p-3 rounded-xl bg-ivory border border-warmborder text-center shadow-subtle">
          <div className="flex flex-col items-center">
            <span className="w-6 h-6 rounded-full bg-primary text-cream font-bold text-xs flex items-center justify-center mb-1 shadow-subtle">1</span>
            <span className="text-[11px] font-bold text-primary">Today</span>
            <span className="text-[10px] text-muted">Immediate inspection</span>
          </div>
          <div className="flex flex-col items-center border-x border-warmborder px-1">
            <span className="w-6 h-6 rounded-full bg-secondary text-cream font-bold text-xs flex items-center justify-center mb-1 shadow-subtle">2</span>
            <span className="text-[11px] font-bold text-secondary-dark">Days 2 to 3</span>
            <span className="text-[10px] text-muted">Spread monitoring</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="w-6 h-6 rounded-full bg-ochre text-cream font-bold text-xs flex items-center justify-center mb-1 shadow-subtle">3</span>
            <span className="text-[11px] font-bold text-ochre">After 5 Days</span>
            <span className="text-[10px] text-muted">KVK escalation check</span>
          </div>
        </div>

        <div className="space-y-2.5">
          {tasks.map((task) => (
            <div
              key={task.id}
              onClick={() => toggleTask(task.id)}
              className={`p-3.5 rounded-natural border cursor-pointer transition-all flex items-start space-x-3 ${
                task.completed
                  ? 'bg-secondary/10 border-secondary/40 text-muted line-through'
                  : 'bg-ivory/50 border-warmborder hover:bg-ivory text-charcoal'
              }`}
            >
              <div className="mt-0.5 text-primary flex-shrink-0">
                {task.completed ? (
                  <CheckSquare className="w-4 h-4 text-secondary-dark" />
                ) : (
                  <Square className="w-4 h-4 text-muted" />
                )}
              </div>
              <div className="flex-1">
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-cream border border-warmborder text-secondary-dark mr-2">
                  {task.period}
                </span>
                <span className="text-xs sm:text-sm">{task.task}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Safety Notice Card */}
      <div className="p-4 rounded-natural bg-ivory border border-warmborder flex items-start space-x-3 mb-6">
        <ShieldCheck className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
        <div className="text-xs leading-relaxed text-charcoal">
          <span className="font-bold text-primary">{t.safety_title}: </span>
          <span>{plan.safety_note}</span>
        </div>
      </div>

      {/* Footer Navigation */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-warmborder">
        <button
          onClick={onScanAnother}
          className="w-full sm:w-auto px-6 py-3.5 rounded-natural bg-primary hover:bg-primary-dark text-cream font-bold text-sm shadow-subtle flex items-center justify-center space-x-2 cursor-pointer"
        >
          <RotateCcw className="w-4 h-4" />
          <span>{t.scan_another_action}</span>
        </button>

        <span className="text-xs text-muted">
          {t.footer_tagline || "Avani Crop Health Intelligence • Grounded in Agricultural Standards"}
        </span>
      </div>

    </div>
  );
};
