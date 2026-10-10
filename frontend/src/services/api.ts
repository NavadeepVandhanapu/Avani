import type { PredictionResponse, ActionPlanResponse, SavedScan, WeatherData, FollowUpAnswers } from '../types';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

export async function checkBackendHealth() {
  try {
    const res = await fetch(`${API_BASE}/health`);
    return await res.json();
  } catch (err) {
    return { status: 'offline', error: err };
  }
}

export async function predictCropLeaf(fileOrBlob: File | Blob): Promise<PredictionResponse> {
  const formData = new FormData();
  formData.append('file', fileOrBlob, 'leaf_photo.jpg');

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
  followUpAnswers: FollowUpAnswers
): Promise<ActionPlanResponse> {
  const res = await fetch(`${API_BASE}/guidance`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      predicted_class: predictedClass,
      confidence: confidence,
      is_healthy: isHealthy,
      follow_up_answers: followUpAnswers,
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

export async function fetchWeatherData(location?: string, lat?: number, lon?: number): Promise<WeatherData> {
  let url = `${API_BASE}/weather`;
  const params = new URLSearchParams();
  if (location) params.append('location', location);
  if (lat !== undefined && lon !== undefined) {
    params.append('lat', lat.toString());
    params.append('lon', lon.toString());
  }
  if (params.toString()) {
    url += `?${params.toString()}`;
  }
    
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error('Failed to retrieve weather advisory.');
  }
  return await res.json();
}

export async function submitFarmerFeedback(feedback: any): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/feedback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(feedback),
    });
    return res.ok;
  } catch (err) {
    console.warn('Feedback submission failed:', err);
    return false;
  }
}
