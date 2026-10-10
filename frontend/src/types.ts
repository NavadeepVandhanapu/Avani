export type Language = 'en' | 'te' | 'hi';

export interface ModelPrediction {
  class_name: string;
  confidence: number;
  crop: string;
  condition: string;
}

export interface PredictionResponse {
  success: boolean;
  is_leaf_detected: boolean;
  is_uncertain: boolean;
  predicted_class: string;
  crop: string;
  condition: string;
  is_healthy: boolean;
  confidence: number;
  confidence_level: 'High' | 'Moderate' | 'Low' | 'Uncertain' | 'None';
  plain_confidence: string;
  plain_explanation: string;
  top_predictions: ModelPrediction[];
  visible_symptoms_reference?: string[];
  scientific_name?: string;
  metrics?: {
    plant_pixel_ratio: number;
    excess_green: number;
    color_variance: number;
  };
  error?: string;
}

export interface FollowUpAnswers {
  q1_crop?: string;
  q2_age?: string;
  q3_field_affected?: string;
  q4_companion_crops?: string;
  q5_weeds?: string;
  q6_first_appeared?: string;
  q7_spreading?: string;
  q8_weather_watering?: string;
}

export interface TimelineActionItem {
  id: string;
  period: string;
  task: string;
  completed: boolean;
}

export interface ActionPlanResponse {
  crop: string;
  condition: string;
  scientific_name: string;
  category: string;
  plain_summary: string;
  visible_symptoms: string[];
  what_to_check_now: string[];
  what_to_monitor: string[];
  when_to_seek_help: string[];
  timeline_actions: TimelineActionItem[];
  safety_note: string;
  summary_bullets: string[];
}

export interface DiseaseRiskItem {
  type: string;
  level: 'High' | 'Elevated' | 'Moderate' | 'Favorable';
  reason: string;
}

export interface WeatherData {
  source: string;
  is_live: boolean;
  location: string;
  temperature: number;
  humidity: number;
  condition: string;
  rainfall_mm: number;
  wind_kmh: number;
  disease_risk: {
    risks: DiseaseRiskItem[];
    primary_level: string;
    advisory: string;
  };
  available_regions?: string[];
}

export interface SavedScan {
  id: string;
  created_at: string;
  crop_name: string;
  predicted_class: string;
  disease_name: string;
  is_healthy: boolean;
  confidence: number;
  confidence_level: string;
  image_preview?: string;
  follow_up_answers?: FollowUpAnswers;
  guidance_summary?: ActionPlanResponse;
}

export interface VoiceQueryResponse {
  success: boolean;
  query: string;
  language: Language;
  matched_crop: string;
  condition: string;
  answer_text: string;
  action_pointers: string[];
  is_scan_context_applied: boolean;
}

