import type { PredictionResponse, ActionPlanResponse, SavedScan, WeatherData, FollowUpAnswers } from '../types';

const API_BASE = 'http://localhost:8000/api';

export async function checkBackendHealth() {
  try {
    const res = await fetch(`${API_BASE}/health`);
    return await res.json();
  } catch (err) {
    return { status: 'offline', error: err };
  }
}

export async function predictCropLeaf(fileOrBlob: File | Blob, language: string = 'en'): Promise<PredictionResponse> {
  const formData = new FormData();
  formData.append('file', fileOrBlob, 'leaf_photo.jpg');
  formData.append('language', language);

  const res = await fetch(`${API_BASE}/predict`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({ detail: 'Analysis failed' }));
    throw new Error(errData.detail || 'Failed to analyze leaf photograph.');
  }

  return await res.json();
}

export async function fetchActionGuidance(
  predictedClass: string,
  confidence: number,
  isHealthy: boolean,
  followUpAnswers: FollowUpAnswers,
  language: string = 'en'
): Promise<ActionPlanResponse> {
  const res = await fetch(`${API_BASE}/guidance`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      predicted_class: predictedClass,
      confidence: confidence,
      is_healthy: isHealthy,
      follow_up_answers: followUpAnswers,
      language: language,
    }),
  });

  if (!res.ok) {
    throw new Error('Failed to generate action plan guidance.');
  }

  return await res.json();
}

export async function fetchScanHistory(): Promise<SavedScan[]> {
  try {
    const res = await fetch(`${API_BASE}/scans`);
    if (!res.ok) return [];
    const data = await res.json();
    return data.scans || [];
  } catch (err) {
    console.warn('Could not fetch scan history from server:', err);
    return [];
  }
}

export async function saveScanHistory(scanData: Partial<SavedScan>): Promise<SavedScan> {
  const res = await fetch(`${API_BASE}/scans`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(scanData),
  });

  if (!res.ok) {
    throw new Error('Failed to save scan record.');
  }

  const data = await res.json();
  return data.scan;
}

export async function deleteScanRecord(scanId: string): Promise<boolean> {
  const res = await fetch(`${API_BASE}/scans/${scanId}`, {
    method: 'DELETE',
  });
  return res.ok;
}

export async function fetchWeatherData(location?: string): Promise<WeatherData> {
  const url = location 
    ? `${API_BASE}/weather?location=${encodeURIComponent(location)}`
    : `${API_BASE}/weather`;
    
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error('Failed to retrieve weather advisory.');
  }
  return await res.json();
}

export async function fetchVoiceQueryAnswer(
  query: string,
  language: string,
  scanContext?: any
) {
  const res = await fetch(`${API_BASE}/voice-query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: query,
      language: language,
      scan_context: scanContext || null
    })
  });

  if (!res.ok) {
    throw new Error('Failed to process voice query.');
  }

  return await res.json();
}

export async function fetchTTSAudio(text: string, language: string): Promise<Blob> {
  const res = await fetch(`${API_BASE}/tts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text: text,
      language: language,
    }),
  });

  if (!res.ok) {
    throw new Error('Failed to generate audio from backend TTS');
  }

  return await res.blob();
}

