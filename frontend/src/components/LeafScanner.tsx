import React, { useState, useRef, useEffect } from 'react';
import { 
  Camera, 
  Upload, 
  AlertCircle, 
  RefreshCw, 
  CheckCircle2, 
  SwitchCamera, 
  VideoOff, 
  Check, 
  Layers
} from 'lucide-react';
import type { Language } from '../types';
import { TRANSLATIONS } from '../translations';

interface LeafScannerProps {
  currentLang: Language;
  onAnalyze: (fileOrBlob: File | Blob, previewUrl: string) => void;
  onCancel: () => void;
}

interface BenchmarkSample {
  id: string;
  name: { en: string; te: string; hi: string };
  crop: { en: string; te: string; hi: string };
  imgUrl: string;
  isHealthy: boolean;
  tag: string;
}

const REAL_DATASET_SAMPLES: BenchmarkSample[] = [
  {
    id: 'tomato_early',
    name: { en: 'Early Blight', te: 'ముందస్తు తెగులు', hi: 'अगेती झुलसा' },
    crop: { en: 'Tomato', te: 'టమోటా', hi: 'टमाटर' },
    imgUrl: '/samples/tomato_early_blight.jpg',
    isHealthy: false,
    tag: '🍅 Tomato'
  },
  {
    id: 'tomato_healthy',
    name: { en: 'Healthy Leaf', te: 'ఆరోగ్యకరమైన ఆకు', hi: 'स्वस्थ पत्ती' },
    crop: { en: 'Tomato', te: 'టమోటా', hi: 'टमाटर' },
    imgUrl: '/samples/tomato_healthy.jpg',
    isHealthy: true,
    tag: '🌿 Tomato'
  },
  {
    id: 'potato_late',
    name: { en: 'Late Blight', te: 'లేట్ బ్లైట్', hi: 'पछेती झुलसा' },
    crop: { en: 'Potato', te: 'బంగాళాదుంప', hi: 'आलू' },
    imgUrl: '/samples/potato_late_blight.jpg',
    isHealthy: false,
    tag: '🥔 Potato'
  },
  {
    id: 'corn_rust',
    name: { en: 'Common Rust', te: 'తుప్పు తెగులు', hi: 'रतुआ' },
    crop: { en: 'Corn (Maize)', te: 'మొక్కజొన్న', hi: 'मक्का' },
    imgUrl: '/samples/corn_common_rust.jpg',
    isHealthy: false,
    tag: '🌽 Corn'
  },
  {
    id: 'pepper_bacterial',
    name: { en: 'Bacterial Spot', te: 'బాక్టీరియల్ మచ్చలు', hi: 'जीवाणु धब्बा' },
    crop: { en: 'Chili / Pepper', te: 'మిరప', hi: 'मिर्च' },
    imgUrl: '/samples/pepper_bacterial_spot.jpg',
    isHealthy: false,
    tag: '🌶️ Pepper'
  },
  {
    id: 'apple_scab',
    name: { en: 'Apple Scab', te: 'యాపిల్ స్కాబ్', hi: 'सेब स्कैब' },
    crop: { en: 'Apple', te: 'యాపిల్', hi: 'सेब' },
    imgUrl: '/samples/apple_scab.jpg',
    isHealthy: false,
    tag: '🍏 Apple'
  }
];

export const LeafScanner: React.FC<LeafScannerProps> = ({
  currentLang,
  onAnalyze,
  onCancel
}) => {
  const t = TRANSLATIONS[currentLang];

  const [selectedFile, setSelectedFile] = useState<File | Blob | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedSampleId, setSelectedSampleId] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isLoadingSample, setIsLoadingSample] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const setVideoRef = (el: HTMLVideoElement | null) => {
    videoRef.current = el;
    if (el && streamRef.current) {
      if (el.srcObject !== streamRef.current) {
        el.srcObject = streamRef.current;
      }
      el.play().catch(e => console.warn('Video play error on ref mount:', e));
    }
  };

  useEffect(() => {
    // Camera is OFF by default unless user explicitly clicks Turn ON Camera
    return () => {
      stopCamera();
    };
  }, []);

  useEffect(() => {
    if (isCameraActive && videoRef.current && streamRef.current) {
      if (videoRef.current.srcObject !== streamRef.current) {
        videoRef.current.srcObject = streamRef.current;
      }
      videoRef.current.play().catch(e => console.warn('Video play error on state active:', e));
    }
  }, [isCameraActive]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedSampleId(null);
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

  const startCamera = async (overrideFacing?: 'environment' | 'user') => {
    setCameraError(null);
    setValidationError(null);
    stopCamera();

    const targetFacing = overrideFacing || facingMode;

    try {
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { 
            facingMode: { ideal: targetFacing }, 
            width: { ideal: 1280 }, 
            height: { ideal: 720 } 
          },
          audio: false
        });
      } catch (firstErr) {
        console.warn('Ideal camera constraint failed, falling back to simple video: true', firstErr);
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      }

      streamRef.current = stream;
      setIsCameraActive(true);
      setFacingMode(targetFacing);

      // Attach immediately if videoRef is already mounted
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(e => console.warn('Video play error:', e));
      }
    } catch (err: any) {
      console.warn('Camera access denied or unavailable:', err);
      setCameraError('Camera access was not granted or is unavailable on this device. Please grant camera permission in your browser or select a photo from device.');
      setIsCameraActive(false);
    }
  };

  const switchCamera = () => {
    const nextFacing = facingMode === 'environment' ? 'user' : 'environment';
    startCamera(nextFacing);
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
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
          setSelectedSampleId(null);
          validateAndSetImage(blob);
        }
      }, 'image/jpeg', 0.92);
    }
  };

  const clearImage = () => {
    setSelectedFile(null);
    setSelectedSampleId(null);
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

  const loadRealDatasetSample = async (sample: BenchmarkSample) => {
    setIsLoadingSample(true);
    setValidationError(null);
    setSelectedSampleId(sample.id);

    try {
      const response = await fetch(sample.imgUrl);
      if (!response.ok) throw new Error('Failed to fetch benchmark image');
      const blob = await response.blob();
      validateAndSetImage(blob);
    } catch (err) {
      console.warn('Real image load fallback:', err);
      // Fallback: load using canvas synthetic representation if needed
      loadFallbackCanvas(sample.id);
    } finally {
      setIsLoadingSample(false);
    }
  };

  const loadNonLeafSample = () => {
    setSelectedSampleId('non_leaf');
    const canvas = document.createElement('canvas');
    canvas.width = 400;
    canvas.height = 400;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#2c3e50';
    ctx.fillRect(0, 0, 400, 400);
    ctx.fillStyle = '#bdc3c7';
    ctx.fillRect(50, 150, 300, 100);
    ctx.font = 'bold 22px sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('Non-Plant Object (Desk / Laptop)', 20, 210);

    canvas.toBlob((blob) => {
      if (blob) {
        validateAndSetImage(blob);
      }
    }, 'image/jpeg', 0.90);
  };

  const loadFallbackCanvas = (_type: string) => {
    const canvas = document.createElement('canvas');
    canvas.width = 400;
    canvas.height = 400;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#F4EFE6';
    ctx.fillRect(0, 0, 400, 400);
    ctx.fillStyle = '#2e7d32';
    ctx.beginPath();
    ctx.ellipse(200, 200, 90, 150, 0, 0, Math.PI * 2);
    ctx.fill();

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
          className="px-3 py-1.5 rounded-lg text-muted hover:bg-ivory border border-transparent hover:border-warmborder transition-colors text-xs font-semibold cursor-pointer"
          title="Cancel"
        >
          Cancel
        </button>
      </div>

      {/* Main Scanner Box */}
      <div className="bg-cream border border-warmborder rounded-card p-5 sm:p-7 shadow-card">
        
        {/* Error Notification */}
        {(validationError || cameraError) && (
          <div className="mb-4 p-3.5 rounded-natural bg-danger-light border border-danger/20 text-danger text-xs sm:text-sm flex items-start space-x-2">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>{validationError || cameraError}</span>
          </div>
        )}

        {/* Live Camera View */}
        {isCameraActive && (
          <div className="relative rounded-natural overflow-hidden bg-charcoal aspect-video sm:aspect-[4/3] flex items-center justify-center mb-5 border border-warmborder shadow-elevated">
            <video
              ref={setVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
            
            {/* Camera Reticle & Alignment Guide */}
            <div className="absolute inset-8 sm:inset-14 border-2 border-dashed border-cream/80 rounded-2xl pointer-events-none flex items-center justify-center">
              <div className="w-8 h-8 border-t-2 border-l-2 border-ochre absolute top-2 left-2" />
              <div className="w-8 h-8 border-t-2 border-r-2 border-ochre absolute top-2 right-2" />
              <div className="w-8 h-8 border-b-2 border-l-2 border-ochre absolute bottom-2 left-2" />
              <div className="w-8 h-8 border-b-2 border-r-2 border-ochre absolute bottom-2 right-2" />
              <span className="bg-charcoal/80 text-cream px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-sm shadow-subtle">
                🌿 Align Crop Leaf Here
              </span>
            </div>

            {/* Camera Floating Controls */}
            <div className="absolute top-3 right-3 flex items-center space-x-2">
              <button
                onClick={switchCamera}
                className="p-2.5 rounded-full bg-charcoal/80 text-cream hover:bg-charcoal text-xs backdrop-blur-sm shadow-subtle cursor-pointer transition-transform active:scale-95"
                title="Switch Camera (Front/Back)"
              >
                <SwitchCamera className="w-4 h-4" />
              </button>
            </div>

            <div className="absolute bottom-4 inset-x-0 flex items-center justify-center space-x-3 px-4">
              <button
                onClick={capturePhoto}
                className="px-6 py-3.5 rounded-full bg-primary text-cream font-bold shadow-elevated hover:bg-primary-dark active:scale-95 flex items-center space-x-2 text-sm cursor-pointer"
                id="camera-snap-btn"
              >
                <Camera className="w-5 h-5 text-cream" />
                <span>Snap Leaf Photo</span>
              </button>
              <button
                onClick={stopCamera}
                className="px-4 py-3.5 rounded-full bg-charcoal/80 text-cream font-medium hover:bg-charcoal text-xs backdrop-blur-sm cursor-pointer"
              >
                <VideoOff className="w-4 h-4 inline mr-1" />
                Close Camera
              </button>
            </div>
          </div>
        )}

        {/* Image Preview View */}
        {!isCameraActive && previewUrl && (
          <div className="relative rounded-natural overflow-hidden border border-warmborder bg-ivory aspect-video sm:aspect-[4/3] flex items-center justify-center mb-5 shadow-subtle">
            <img
              src={previewUrl}
              alt="Leaf Preview"
              className="w-full h-full object-contain"
            />
            <div className="absolute top-3 right-3 flex items-center space-x-2">
              <button
                type="button"
                onClick={() => startCamera()}
                className="px-3 py-1.5 rounded-lg bg-primary text-cream hover:bg-primary-dark text-xs font-bold backdrop-blur-sm shadow-subtle flex items-center space-x-1.5 cursor-pointer transition-all"
                title="Turn ON Live Camera to scan a real plant"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>{t.switch_to_camera || "Switch to Live Camera"}</span>
              </button>
              <button
                onClick={clearImage}
                className="px-3 py-1.5 rounded-lg bg-charcoal/80 text-cream hover:bg-charcoal text-xs font-medium backdrop-blur-sm shadow-subtle flex items-center space-x-1 cursor-pointer"
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
            
            {/* Option 1: Live Camera Button */}
            <button
              type="button"
              onClick={() => startCamera()}
              className="p-6 rounded-natural border-2 border-primary/40 hover:border-primary bg-primary/5 hover:bg-primary/10 text-center flex flex-col items-center justify-center transition-all cursor-pointer group shadow-subtle"
              id="turn-on-camera-btn"
            >
              <div className="w-14 h-14 rounded-2xl bg-primary text-cream flex items-center justify-center mb-3 group-hover:scale-105 transition-transform shadow-subtle">
                <Camera className="w-7 h-7 text-cream" />
              </div>
              <h3 className="text-base font-bold text-primary">
                📷 Turn ON Live Camera
              </h3>
              <p className="text-xs text-muted mt-1 max-w-xs">
                Snap leaf photo directly in field with your device camera
              </p>
            </button>

            {/* Option 2: Upload File / Gallery */}
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="p-6 rounded-natural border-2 border-dashed border-warmborder-dark/60 hover:border-secondary-dark bg-ivory/50 hover:bg-ivory text-center flex flex-col items-center justify-center transition-all cursor-pointer group"
            >
              <div className="w-14 h-14 rounded-2xl bg-secondary/20 text-secondary-dark flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                <Upload className="w-7 h-7 text-secondary-dark" />
              </div>
              <h3 className="text-base font-bold text-charcoal">
                📂 Upload Leaf Image
              </h3>
              <p className="text-xs text-muted mt-1 max-w-xs">
                Select JPG, PNG, or WebP photo from device files
              </p>
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

        {/* Real Leaf Dataset Gallery (PlantVillage Benchmark 87K) */}
        {!isCameraActive && (
          <div className="pt-5 border-t border-warmborder">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-1.5">
                <Layers className="w-4 h-4 text-primary" />
                <span className="text-xs font-bold text-charcoal uppercase tracking-wider">
                  Test with Real Leaf Dataset (PlantVillage Benchmark)
                </span>
              </div>
              <span className="text-[10px] text-muted font-medium bg-ivory px-2 py-0.5 rounded-full border border-warmborder hidden sm:inline">
                87K Verified Disease Dataset
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
              {REAL_DATASET_SAMPLES.map((s) => {
                const isSelected = selectedSampleId === s.id;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => loadRealDatasetSample(s)}
                    disabled={isLoadingSample}
                    className={`relative p-2 rounded-xl border text-left transition-all flex flex-col items-center cursor-pointer group ${
                      isSelected
                        ? 'border-primary bg-primary/10 ring-2 ring-primary/40 shadow-subtle'
                        : 'border-warmborder bg-ivory/50 hover:bg-white hover:border-primary/50'
                    }`}
                  >
                    <div className="w-full aspect-square rounded-lg overflow-hidden mb-1.5 bg-warmborder/30 border border-warmborder flex items-center justify-center">
                      <img 
                        src={s.imgUrl} 
                        alt={s.name.en} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform" 
                      />
                    </div>
                    <div className="w-full text-center">
                      <p className="text-[11px] font-bold text-charcoal truncate">
                        {s.name[currentLang]}
                      </p>
                      <p className="text-[10px] text-muted truncate">
                        {s.crop[currentLang]}
                      </p>
                    </div>
                    {isSelected && (
                      <div className="absolute top-1 right-1 bg-primary text-cream rounded-full p-0.5 shadow-subtle">
                        <Check className="w-2.5 h-2.5" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Non-leaf Safety Rejection Test */}
            <div className="mt-2.5 flex items-center justify-end">
              <button
                type="button"
                onClick={loadNonLeafSample}
                className={`px-3 py-1 rounded-lg border text-[11px] font-medium transition-all cursor-pointer flex items-center space-x-1 ${
                  selectedSampleId === 'non_leaf'
                    ? 'border-danger bg-danger-light text-danger font-bold'
                    : 'border-warmborder bg-ivory/60 text-muted hover:text-danger hover:border-danger/40'
                }`}
                title="Test safety heuristic for non-leaf objects"
              >
                <span>🚫 Test Non-Leaf Rejection (Desk / Keyboard)</span>
              </button>
            </div>
          </div>
        )}

        {/* Primary Action Buttons */}
        {previewUrl && !isCameraActive && (
          <div className="mt-5 flex flex-col sm:flex-row items-center gap-3">
            <button
              onClick={handleStartAnalysis}
              className="w-full sm:flex-1 py-4 rounded-natural bg-primary hover:bg-primary-dark text-cream font-bold text-base shadow-elevated flex items-center justify-center space-x-2 transition-all active:scale-[0.99] cursor-pointer"
              id="check-leaf-action-btn"
            >
              <CheckCircle2 className="w-5 h-5 text-cream" />
              <span>{t.check_leaf_action}</span>
            </button>

            <button
              type="button"
              onClick={() => startCamera()}
              className="w-full sm:w-auto px-6 py-4 rounded-natural bg-secondary/15 hover:bg-secondary/25 border border-secondary/40 text-primary-dark font-bold text-sm shadow-subtle flex items-center justify-center space-x-2 transition-all cursor-pointer"
              title="Turn on live camera to capture a real plant leaf in field"
            >
              <Camera className="w-4 h-4 text-secondary-dark" />
              <span>{t.scan_real_camera || "Scan Real Leaf (Camera)"}</span>
            </button>
          </div>
        )}

      </div>

    </div>
  );
};
