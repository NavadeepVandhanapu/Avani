import React, { useState, useRef, useEffect } from 'react';
import { Camera, Upload, Image as ImageIcon, AlertCircle, Info, RefreshCw, Sparkles, CheckCircle2 } from 'lucide-react';
import type { Language } from '../types';
import { TRANSLATIONS } from '../translations';

interface LeafScannerProps {
  currentLang: Language;
  onAnalyze: (fileOrBlob: File | Blob, previewUrl: string) => void;
  onCancel: () => void;
}

export const LeafScanner: React.FC<LeafScannerProps> = ({
  currentLang,
  onAnalyze,
  onCancel
}) => {
  const t = TRANSLATIONS[currentLang];

  const [selectedFile, setSelectedFile] = useState<File | Blob | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    validateAndSetImage(file);
  };

  const validateAndSetImage = (file: File | Blob) => {
    setValidationError(null);
    
    if (file.type && !file.type.startsWith('image/')) {
      setValidationError('Please select an image file (JPG, PNG, or WebP).');
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      setValidationError('Image size exceeds 15MB. Please choose a smaller photo.');
      return;
    }

    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    stopCamera();
  };

  const startCamera = async () => {
    setCameraError(null);
    setValidationError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setIsCameraActive(true);
    } catch (err: any) {
      console.warn('Camera access denied or unavailable:', err);
      setCameraError('Camera access was not granted or is unavailable on this device. Please select a photo from your files.');
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((blob) => {
        if (blob) {
          validateAndSetImage(blob);
        }
      }, 'image/jpeg', 0.92);
    }
  };

  const clearImage = () => {
    setSelectedFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setValidationError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleStartAnalysis = () => {
    if (!selectedFile || !previewUrl) {
      setValidationError('Please capture or select a leaf photo first.');
      return;
    }
    onAnalyze(selectedFile, previewUrl);
  };

  const loadSampleLeaf = (type: 'tomato_early' | 'tomato_healthy' | 'potato_late' | 'corn_rust' | 'non_leaf') => {
    const canvas = document.createElement('canvas');
    canvas.width = 400;
    canvas.height = 400;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (type === 'non_leaf') {
      ctx.fillStyle = '#2c3e50';
      ctx.fillRect(0, 0, 400, 400);
      ctx.fillStyle = '#bdc3c7';
      ctx.fillRect(50, 150, 300, 100);
      ctx.font = '20px sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.fillText('Desk Surface / Keyboard', 80, 210);
    } else {
      ctx.fillStyle = '#F4EFE6';
      ctx.fillRect(0, 0, 400, 400);

      ctx.save();
      ctx.translate(200, 200);
      
      if (type === 'corn_rust') {
        ctx.fillStyle = '#4e8c3b';
        ctx.beginPath();
        ctx.ellipse(0, 0, 75, 175, Math.PI / 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#396d29';
        ctx.lineWidth = 4;
        ctx.stroke();

        ctx.fillStyle = '#c0392b';
        for (let i = -100; i < 100; i += 22) {
          ctx.beginPath();
          ctx.ellipse((i % 30) - 10, i, 8, 4, Math.PI / 4, 0, Math.PI * 2);
          ctx.fill();
        }
      } else {
        ctx.fillStyle = type === 'tomato_healthy' ? '#2e7d32' : '#438945';
        ctx.beginPath();
        ctx.moveTo(0, -150);
        ctx.bezierCurveTo(90, -100, 130, 60, 0, 140);
        ctx.bezierCurveTo(-130, 60, -90, -100, 0, -150);
        ctx.fill();
        ctx.strokeStyle = '#2b632d';
        ctx.lineWidth = 4;
        ctx.stroke();

        ctx.strokeStyle = '#55a158';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(0, -130);
        ctx.lineTo(0, 120);
        ctx.stroke();

        if (type === 'tomato_early') {
          ctx.fillStyle = '#d4ac0d';
          ctx.beginPath();
          ctx.arc(-25, 20, 35, 0, Math.PI * 2);
          ctx.arc(30, -30, 28, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#4a2306';
          ctx.beginPath();
          ctx.arc(-25, 20, 22, 0, Math.PI * 2);
          ctx.arc(30, -30, 18, 0, Math.PI * 2);
          ctx.fill();

          ctx.strokeStyle = '#2b1403';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(-25, 20, 12, 0, Math.PI * 2);
          ctx.arc(-25, 20, 6, 0, Math.PI * 2);
          ctx.stroke();
        } else if (type === 'potato_late') {
          ctx.fillStyle = '#a08365';
          ctx.beginPath();
          ctx.arc(15, -40, 45, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#2f1f14';
          ctx.beginPath();
          ctx.arc(15, -40, 28, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#e8f5e9';
          ctx.beginPath();
          ctx.arc(42, -35, 12, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.restore();
    }

    canvas.toBlob((blob) => {
      if (blob) {
        validateAndSetImage(blob);
      }
    }, 'image/jpeg', 0.92);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-primary font-sans">
            {t.upload_heading}
          </h2>
          <p className="text-xs sm:text-sm text-muted mt-0.5">
            {t.upload_subheading}
          </p>
        </div>
        <button
          onClick={onCancel}
          className="p-2 rounded-lg text-muted hover:bg-ivory transition-colors text-xs font-semibold"
          title="Cancel"
        >
          Cancel
        </button>
      </div>

      {/* Main Scanner Box */}
      <div className="bg-cream border border-warmborder rounded-card p-6 shadow-card">
        
        {/* Error Notification */}
        {(validationError || cameraError) && (
          <div className="mb-4 p-3.5 rounded-natural bg-danger-light border border-danger/20 text-danger text-xs sm:text-sm flex items-start space-x-2">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>{validationError || cameraError}</span>
          </div>
        )}

        {/* Live Camera View */}
        {isCameraActive && (
          <div className="relative rounded-natural overflow-hidden bg-charcoal aspect-video sm:aspect-[4/3] flex items-center justify-center mb-4 border border-warmborder">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-8 border-2 border-dashed border-cream/70 rounded-2xl pointer-events-none flex items-center justify-center">
              <span className="bg-charcoal/70 text-cream px-3 py-1 rounded-full text-xs font-medium backdrop-blur-sm">
                Position leaf inside frame
              </span>
            </div>

            <div className="absolute bottom-4 inset-x-0 flex items-center justify-center space-x-4">
              <button
                onClick={capturePhoto}
                className="px-6 py-3 rounded-full bg-cream text-primary font-bold shadow-elevated hover:bg-ivory active:scale-95 flex items-center space-x-2 text-sm"
              >
                <Camera className="w-4 h-4 text-primary" />
                <span>Snap Leaf Photo</span>
              </button>
              <button
                onClick={stopCamera}
                className="px-4 py-3 rounded-full bg-charcoal/80 text-cream font-medium hover:bg-charcoal text-xs backdrop-blur-sm"
              >
                Cancel Camera
              </button>
            </div>
          </div>
        )}

        {/* Image Preview View */}
        {!isCameraActive && previewUrl && (
          <div className="relative rounded-natural overflow-hidden border border-warmborder bg-ivory aspect-video sm:aspect-[4/3] flex items-center justify-center mb-5">
            <img
              src={previewUrl}
              alt="Leaf Preview"
              className="w-full h-full object-contain"
            />
            <div className="absolute top-3 right-3 flex items-center space-x-2">
              <button
                onClick={clearImage}
                className="px-3 py-1.5 rounded-lg bg-charcoal/80 text-cream hover:bg-charcoal text-xs font-medium backdrop-blur-sm shadow-subtle flex items-center space-x-1"
                title={t.change_photo}
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>{t.change_photo}</span>
              </button>
            </div>
          </div>
        )}

        {/* Upload Buttons & Drop Area */}
        {!isCameraActive && !previewUrl && (
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-warmborder-dark/60 hover:border-primary/60 rounded-natural p-8 text-center cursor-pointer transition-colors bg-ivory/50 hover:bg-ivory mb-5"
          >
            <div className="w-14 h-14 rounded-2xl bg-secondary/15 text-primary mx-auto flex items-center justify-center mb-3">
              <ImageIcon className="w-7 h-7 text-primary" />
            </div>
            <h3 className="text-base font-bold text-charcoal">
              Click to select a leaf photograph
            </h3>
            <p className="text-xs text-muted mt-1 max-w-sm mx-auto">
              PNG, JPG, or WebP files up to 15MB.
            </p>

            <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  startCamera();
                }}
                className="px-4 py-2.5 rounded-natural bg-secondary text-cream hover:bg-secondary-dark font-medium text-xs sm:text-sm flex items-center space-x-2 shadow-subtle"
              >
                <Camera className="w-4 h-4" />
                <span>{t.take_photo_btn}</span>
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
                className="px-4 py-2.5 rounded-natural bg-cream border border-warmborder text-charcoal hover:bg-ivory font-medium text-xs sm:text-sm flex items-center space-x-2 shadow-subtle"
              >
                <Upload className="w-4 h-4 text-muted" />
                <span>{t.choose_photo_btn}</span>
              </button>
            </div>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />

        {/* 1-Click Sample Leaf Testing Tray */}
        {!isCameraActive && (
          <div className="pt-4 border-t border-warmborder/80">
            <div className="flex items-center space-x-1.5 text-xs font-semibold text-charcoal mb-2.5">
              <Sparkles className="w-3.5 h-3.5 text-ochre" />
              <span>{t.sample_leaves_heading}</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              <button
                type="button"
                onClick={() => loadSampleLeaf('tomato_early')}
                className="p-2 rounded-lg border border-warmborder bg-ivory/60 hover:bg-ivory hover:border-primary/40 text-[11px] font-medium text-charcoal text-center transition-all"
              >
                🍅 {t.sample_tomato_early}
              </button>
              <button
                type="button"
                onClick={() => loadSampleLeaf('tomato_healthy')}
                className="p-2 rounded-lg border border-warmborder bg-ivory/60 hover:bg-ivory hover:border-primary/40 text-[11px] font-medium text-charcoal text-center transition-all"
              >
                🌿 {t.sample_tomato_healthy}
              </button>
              <button
                type="button"
                onClick={() => loadSampleLeaf('potato_late')}
                className="p-2 rounded-lg border border-warmborder bg-ivory/60 hover:bg-ivory hover:border-primary/40 text-[11px] font-medium text-charcoal text-center transition-all"
              >
                🥔 {t.sample_potato_late}
              </button>
              <button
                type="button"
                onClick={() => loadSampleLeaf('corn_rust')}
                className="p-2 rounded-lg border border-warmborder bg-ivory/60 hover:bg-ivory hover:border-primary/40 text-[11px] font-medium text-charcoal text-center transition-all"
              >
                🌽 {t.sample_corn_rust}
              </button>
              <button
                type="button"
                onClick={() => loadSampleLeaf('non_leaf')}
                className="p-2 rounded-lg border border-warmborder bg-ivory/60 hover:bg-ivory hover:border-danger/40 text-[11px] font-medium text-charcoal text-center transition-all"
              >
                🚫 {t.sample_non_leaf}
              </button>
            </div>
          </div>
        )}

        {/* Primary Action Button */}
        {previewUrl && (
          <div className="mt-5">
            <button
              onClick={handleStartAnalysis}
              className="w-full py-3.5 rounded-natural bg-primary hover:bg-primary-dark text-cream font-bold text-base shadow-elevated flex items-center justify-center space-x-2 transition-all active:scale-[0.99]"
              id="check-leaf-action-btn"
            >
              <CheckCircle2 className="w-5 h-5 text-cream" />
              <span>{t.check_leaf_action}</span>
            </button>
          </div>
        )}

      </div>

      {/* Photo-Taking Tips Card */}
      <div className="mt-5 p-4 rounded-natural bg-ivory border border-warmborder text-xs text-charcoal space-y-2">
        <div className="flex items-center space-x-1.5 font-bold text-primary">
          <Info className="w-4 h-4 text-primary" />
          <span>{t.tips_title}</span>
        </div>
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-muted list-disc list-inside">
          <li>{t.tip_1}</li>
          <li>{t.tip_2}</li>
          <li>{t.tip_3}</li>
          <li>{t.tip_4}</li>
        </ul>
      </div>

    </div>
  );
};
