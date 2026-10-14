export type Language = 'en' | 'te' | 'hi';

export interface ModelPrediction {
  class_name: string;
  confidence: number;
  crop: string;
  condition: string;
}

export interface HSVHotspotPin {
  id: string;
  type: 'lesion' | 'chlorosis' | 'healthy' | 'blight_margin';
  label: string;
  telugu_label?: string;
  hindi_label?: string;
  x: number;
  y: number;
  color: string;
  severity: string;
  pigment?: string;
  description: string;
  telugu_desc?: string;
  hindi_desc?: string;
}

export interface HSVSegmentationData {
  healthy_percentage: number;
  lesion_percentage: number;
  leaf_coverage_ratio: number;
  chlorosis_yellow_pct?: number;
  necrosis_brown_pct?: number;
  segmentation_mask_url?: string;
  annotated_mask_url?: string;
  hotspots?: HSVHotspotPin[];
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
  hsv_segmentation?: HSVSegmentationData;
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
  // Dynamic question keys
  healthy_other_symptoms?: string;
  healthy_distribution?: string;
  healthy_water_stress?: string;
  healthy_growth_stage?: string;
  uncertain_crop_confirm?: string;
  uncertain_symptom_type?: string;
  uncertain_symptom_duration?: string;
  uncertain_spread?: string;
  spot_appearance?: string;
  spot_plant_part?: string;
  spot_field_spread?: string;
  spot_spread_rate?: string;
  spot_moisture_conditions?: string;
  blight_progression?: string;
  blight_plant_parts?: string;
  blight_field_extent?: string;
  blight_weather?: string;
  rust_pustules?: string;
  rust_leaf_surface?: string;
  rust_spread?: string;
  rust_crop_stage?: string;
  mildew_appearance?: string;
  mildew_canopy?: string;
  mildew_spread?: string;
  viral_symptoms?: string;
  vector_presence?: string;
  viral_spread?: string;
  [key: string]: string | undefined;
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

export interface FarmerFeedback {
  scan_id?: string;
  predicted_class: string;
  rating: 'accurate' | 'partial' | 'incorrect';
  is_accurate: boolean;
  actual_condition?: string;
  notes?: string;
}
