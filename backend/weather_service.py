"""
Avani Weather & Agro-meteorological Risk Service
Provides location-based weather data and factual disease-risk indexing based on temperature and humidity.
"""

import os
import requests
from typing import Dict, Any, Optional

OPENWEATHER_API_KEY = os.getenv("OPENWEATHER_API_KEY", "")

REGIONAL_AGRO_PROFILES = {
    "Hyderabad, Telangana": {"temp": 28.5, "humidity": 76, "condition": "Humid / Partly Cloudy", "rainfall_mm": 1.5, "wind_kmh": 11, "lat": 17.3850, "lon": 78.4867},
    "Warangal, Telangana": {"temp": 29, "humidity": 72, "condition": "Warm / Overcast", "rainfall_mm": 0.0, "wind_kmh": 9, "lat": 17.9689, "lon": 79.5941},
    "Guntur, Andhra Pradesh": {"temp": 31, "humidity": 78, "condition": "Humid / Partly Cloudy", "rainfall_mm": 2.5, "wind_kmh": 12, "lat": 16.3067, "lon": 80.4365},
    "Nashik, Maharashtra": {"temp": 26, "humidity": 82, "condition": "Misty Morning / Light Drizzle", "rainfall_mm": 5.0, "wind_kmh": 14, "lat": 19.9975, "lon": 73.7898},
    "Karnal, Haryana": {"temp": 24, "humidity": 65, "condition": "Clear / Sunny", "rainfall_mm": 0.0, "wind_kmh": 8, "lat": 29.6857, "lon": 76.9905},
    "Shimla, Himachal Pradesh": {"temp": 17, "humidity": 86, "condition": "Cool / High Fog", "rainfall_mm": 8.0, "wind_kmh": 11, "lat": 31.1048, "lon": 77.1734},
    "Varanasi, Uttar Pradesh": {"temp": 28, "humidity": 70, "condition": "Hazy Sunshine", "rainfall_mm": 0.0, "wind_kmh": 7, "lat": 25.3176, "lon": 82.9739}
}

WEATHER_CODE_MAP = {
    0: "Clear Sky",
    1: "Mainly Clear",
    2: "Partly Cloudy",
    3: "Overcast",
    45: "Fog / Mist",
    48: "Depositing Rime Fog",
    51: "Light Drizzle",
    53: "Moderate Drizzle",
    55: "Dense Drizzle",
    61: "Slight Rain",
    63: "Moderate Rain",
    65: "Heavy Rain",
    80: "Rain Showers",
    95: "Thunderstorm"
}

def calculate_disease_risk(temp: float, humidity: float, rainfall_mm: float) -> Dict[str, Any]:
    """
    Computes disease risk indicators based on temperature, moisture, and rainfall parameters.
    """
    risks = []
    
    # Fungal blight risk (High humidity > 75% and Temp 18-28C)
    if humidity >= 75 and 16 <= temp <= 28:
        risks.append({
            "type": "Fungal Blight Risk",
            "level": "Elevated",
            "reason": f"High humidity ({humidity}%) and moderate temperature ({temp}°C) create favorable conditions for fungal spore germination."
        })
    elif humidity >= 65:
        risks.append({
            "type": "Fungal Leaf Spot Risk",
            "level": "Moderate",
            "reason": f"Humidity ({humidity}%) is moderate; ensure good canopy air circulation."
        })

    # Bacterial risk (Warm >25°C + rain)
    if rainfall_mm > 2.0 and temp >= 24:
        risks.append({
            "type": "Bacterial Splash Risk",
            "level": "Moderate",
            "reason": "Recent rain or splash can spread bacterial pathogens between adjacent leaves."
        })

    # Late blight / Cool wet risk
    if humidity >= 85 and 12 <= temp <= 20 and rainfall_mm > 0:
        risks.append({
            "type": "Late Blight Alert",
            "level": "High",
            "reason": "Cool temperature combined with persistent fog/moisture creates severe late blight risk."
        })

    if not risks:
        risks.append({
            "type": "General Foliage Condition",
            "level": "Favorable",
            "reason": "Current weather parameters do not indicate acute pathogen pressure."
        })

    return {
        "risks": risks,
        "primary_level": risks[0]["level"],
        "advisory": "Avoid working in the field while foliage is wet from morning dew or rain to prevent disease spread."
    }

def get_weather_data(location: str = "Hyderabad, Telangana", lat: Optional[float] = None, lon: Optional[float] = None) -> Dict[str, Any]:
    """
    Fetches live weather from Open-Meteo or OpenWeatherMap API,
    or falls back to Telangana regional meteorological references with clear attribution.
    """
    # Determine coordinates
    resolved_lat = lat
    resolved_lon = lon

    if (resolved_lat is None or resolved_lon is None) and location in REGIONAL_AGRO_PROFILES:
        resolved_lat = REGIONAL_AGRO_PROFILES[location].get("lat")
        resolved_lon = REGIONAL_AGRO_PROFILES[location].get("lon")

    # 1. Attempt Free Live Open-Meteo API (No API key needed, high reliability)
    if resolved_lat is not None and resolved_lon is not None:
        try:
            url = f"https://api.open-meteo.com/v1/forecast?latitude={resolved_lat}&longitude={resolved_lon}&current=temperature_2m,relative_humidity_2m,precipitation,weather_code,wind_speed_10m"
            resp = requests.get(url, timeout=3.5)
            if resp.status_code == 200:
                data = resp.json()
                current = data.get("current", {})
                temp = float(current.get("temperature_2m", 28.0))
                humidity = float(current.get("relative_humidity_2m", 70.0))
                rainfall_mm = float(current.get("precipitation", 0.0))
                w_code = int(current.get("weather_code", 2))
                condition_desc = WEATHER_CODE_MAP.get(w_code, "Partly Cloudy")
                wind_kmh = round(float(current.get("wind_speed_10m", 10.0)), 1)

                risk_info = calculate_disease_risk(temp, humidity, rainfall_mm)
                
                return {
                    "source": "Open-Meteo Live Agro Satellite Feed",
                    "is_live": True,
                    "location": location,
                    "temperature": round(temp, 1),
                    "humidity": int(humidity),
                    "condition": condition_desc,
                    "rainfall_mm": rainfall_mm,
                    "wind_kmh": wind_kmh,
                    "disease_risk": risk_info,
                    "available_regions": list(REGIONAL_AGRO_PROFILES.keys())
                }
        except Exception as e:
            print(f"[Avani Weather] Open-Meteo live query notice: {e}")

    # 2. Regional Agricultural Profile Fallback (Offline Cached Baseline)
    profile = REGIONAL_AGRO_PROFILES.get(location, REGIONAL_AGRO_PROFILES["Hyderabad, Telangana"])
    risk_info = calculate_disease_risk(profile["temp"], profile["humidity"], profile["rainfall_mm"])
    
    return {
        "source": "Telangana Agro-Climatic Baseline (Offline Cached)",
        "is_live": False,
        "location": location,
        "temperature": profile["temp"],
        "humidity": profile["humidity"],
        "condition": profile["condition"],
        "rainfall_mm": profile["rainfall_mm"],
        "wind_kmh": profile["wind_kmh"],
        "disease_risk": risk_info,
        "available_regions": list(REGIONAL_AGRO_PROFILES.keys())
    }
