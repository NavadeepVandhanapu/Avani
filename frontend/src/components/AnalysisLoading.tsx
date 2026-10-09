import React from 'react';
import { Sprout } from 'lucide-react';
import type { Language } from '../types';
import { TRANSLATIONS } from '../translations';

interface AnalysisLoadingProps {
  currentLang: Language;
  previewUrl: string | null;
}

export const AnalysisLoading: React.FC<AnalysisLoadingProps> = ({
  currentLang,
  previewUrl
}) => {
  const t = TRANSLATIONS[currentLang];

  return (
    <div className="max-w-md mx-auto px-4 py-12 text-center">
      <div className="bg-cream border border-warmborder rounded-card p-8 shadow-card flex flex-col items-center">
        
        {/* Leaf image preview with scanning ripple */}
        <div className="relative w-28 h-28 rounded-2xl overflow-hidden border-2 border-secondary/40 mb-6 bg-ivory shadow-subtle flex items-center justify-center">
          {previewUrl ? (
            <img
              src={previewUrl}
              alt="Analyzing leaf"
              className="w-full h-full object-cover animate-pulse-gentle"
            />
          ) : (
            <Sprout className="w-12 h-12 text-primary animate-pulse" />
          )}
          
          {/* Subtle scanning bar */}
          <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-primary to-transparent animate-bounce opacity-80"></div>
        </div>

        {/* Text */}
        <h3 className="text-lg font-bold text-primary font-sans">
          {t.analyzing_title}
        </h3>
        <p className="text-xs text-muted mt-1.5 max-w-xs leading-relaxed">
          {t.analyzing_subtitle}
        </p>

        {/* Step dots */}
        <div className="mt-6 flex items-center space-x-2 text-[11px] text-muted-light font-medium">
          <span className="w-2 h-2 rounded-full bg-primary animate-ping"></span>
          <span>Evaluating leaf features & disease taxonomy</span>
        </div>

      </div>
    </div>
  );
};
