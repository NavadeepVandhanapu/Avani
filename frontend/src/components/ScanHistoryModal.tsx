import React, { useState } from 'react';
import { History, X, Trash2, Calendar, FileText, CheckCircle2, Eye } from 'lucide-react';
import type { Language, SavedScan } from '../types';
import { TRANSLATIONS } from '../translations';

interface ScanHistoryModalProps {
  currentLang: Language;
  scans: SavedScan[];
  onClose: () => void;
  onDeleteScan: (id: string) => void;
  onSelectScan: (scan: SavedScan) => void;
}

export const ScanHistoryModal: React.FC<ScanHistoryModalProps> = ({
  currentLang,
  scans,
  onClose,
  onDeleteScan,
  onSelectScan
}) => {
  const t = TRANSLATIONS[currentLang];
  const [inspectingScan, setInspectingScan] = useState<SavedScan | null>(null);

  const formatDate = (isoStr: string) => {
    try {
      const d = new Date(isoStr);
      return d.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return isoStr;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-charcoal/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-cream border border-warmborder rounded-card p-6 max-w-2xl w-full shadow-elevated relative max-h-[88vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-warmborder">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-ivory text-primary flex items-center justify-center">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-primary font-sans">
                {t.history_heading}
              </h3>
              <p className="text-xs text-muted">
                {scans.length} {scans.length === 1 ? 'saved scan' : 'saved scans'} in local storage
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

        {/* Scan Detail Inspector View */}
        {inspectingScan ? (
          <div className="py-4 overflow-y-auto flex-1 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-warmborder">
              <div>
                <h4 className="text-base font-bold text-primary">
                  {inspectingScan.crop_name} — {inspectingScan.disease_name}
                </h4>
                <p className="text-xs text-muted flex items-center space-x-1.5 mt-0.5">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{formatDate(inspectingScan.created_at)}</span>
                </p>
              </div>
              <button
                onClick={() => setInspectingScan(null)}
                className="text-xs font-semibold text-primary hover:underline"
              >
                &larr; Back to list
              </button>
            </div>

            {/* Image & Confidence */}
            <div className="flex items-center space-x-4 bg-ivory p-3.5 rounded-natural border border-warmborder">
              {inspectingScan.image_preview && (
                <img
                  src={inspectingScan.image_preview}
                  alt="Saved scan"
                  className="w-16 h-16 rounded-xl object-cover border border-warmborder"
                />
              )}
              <div className="text-xs space-y-1">
                <p><span className="font-semibold">Classification:</span> {inspectingScan.predicted_class}</p>
                <p><span className="font-semibold">Confidence:</span> {inspectingScan.confidence_level} ({Math.round(inspectingScan.confidence * 100)}%)</p>
                <p><span className="font-semibold">Status:</span> {inspectingScan.is_healthy ? 'Healthy' : 'Symptom Observed'}</p>
              </div>
            </div>

            {/* Guidance Sections */}
            {inspectingScan.guidance_summary && (
              <div className="space-y-3 text-xs">
                <div className="p-3 bg-ivory/60 rounded-natural border border-warmborder">
                  <h5 className="font-bold text-primary mb-1.5">What to Check:</h5>
                  <ul className="list-disc list-inside space-y-1 text-muted">
                    {inspectingScan.guidance_summary.what_to_check_now?.map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                </div>

                <div className="p-3 bg-ivory/60 rounded-natural border border-warmborder">
                  <h5 className="font-bold text-primary mb-1.5">What to Monitor:</h5>
                  <ul className="list-disc list-inside space-y-1 text-muted">
                    {inspectingScan.guidance_summary.what_to_monitor?.map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                </div>

                <button
                  onClick={() => onSelectScan(inspectingScan)}
                  className="w-full py-2.5 rounded-natural bg-primary text-cream font-bold text-xs"
                >
                  Load Full Action Plan
                </button>
              </div>
            )}
          </div>
        ) : (
          /* Scans List */
          <div className="py-4 overflow-y-auto flex-1 space-y-3">
            {scans.length === 0 ? (
              <div className="text-center py-12 text-muted">
                <FileText className="w-10 h-10 mx-auto mb-2.5 text-muted-light" />
                <p className="text-sm font-medium">{t.history_empty}</p>
              </div>
            ) : (
              scans.map((scan) => (
                <div
                  key={scan.id}
                  className="p-3.5 rounded-natural border border-warmborder bg-ivory/40 hover:bg-ivory transition-all flex items-center justify-between space-x-3 group"
                >
                  <div 
                    onClick={() => setInspectingScan(scan)}
                    className="flex items-center space-x-3 flex-1 cursor-pointer"
                  >
                    {scan.image_preview ? (
                      <img
                        src={scan.image_preview}
                        alt="Thumbnail"
                        className="w-12 h-12 rounded-xl object-cover border border-warmborder flex-shrink-0"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-ivory flex items-center justify-center text-primary flex-shrink-0 border border-warmborder">
                        <CheckCircle2 className="w-6 h-6 text-secondary" />
                      </div>
                    )}
                    <div>
                      <h4 className="text-sm font-bold text-charcoal group-hover:text-primary">
                        {scan.crop_name} — {scan.disease_name}
                      </h4>
                      <div className="flex items-center space-x-2 text-[11px] text-muted mt-0.5">
                        <span>{formatDate(scan.created_at)}</span>
                        <span>•</span>
                        <span>{scan.confidence_level} ({Math.round(scan.confidence * 100)}%)</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-1.5">
                    <button
                      onClick={() => setInspectingScan(scan)}
                      className="p-2 rounded-lg text-primary hover:bg-cream border border-transparent hover:border-warmborder transition-colors text-xs font-semibold flex items-center space-x-1"
                      title="Inspect Plan"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDeleteScan(scan.id)}
                      className="p-2 rounded-lg text-muted hover:text-danger hover:bg-danger-light/50 transition-colors"
                      title={t.btn_delete}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Footer */}
        <div className="pt-4 border-t border-warmborder text-right">
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
