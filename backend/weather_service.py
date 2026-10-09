"""
Avani Weather & Agro-meteorological Risk Service
Provides location-based weather data and factual disease-risk indexing based on temperature and humidity.
"""

import os
import requests
from typing import Dict, Any, Optional

OPENWEATHER_API_KEY = os.getenv("OPENWEATHER_API_KEY", "")

REGIONAL_AGRO_PROFILES = {
    "Guntur, Andhra Pradesh": {"temp": 31, "humidity": 78, "condition": "Humid / Partly Cloudy", "rainfall_mm": 2.5, "wind_kmh": 12},
    "Warangal, Telangana": {"temp": 29, "humidity": 72, "condition": "Warm / Overcast", "rainfall_mm": 0.0, "wind_kmh": 9},
    "Nashik, Maharashtra": {"temp": 26, "humidity": 82, "condition": "Misty Morning / Light Drizzle", "rainfall_mm": 5.0, "wind_kmh": 14},
    "Karnal, Haryana": {"temp": 24, "humidity": 65, "condition": "Clear / Sunny", "rainfall_mm": 0.0, "wind_kmh": 8},
    "Shimla, Himachal Pradesh": {"temp": 17, "humidity": 86, "condition": "Cool / High Fog", "rainfall_mm": 8.0, "wind_kmh": 11},
    "Varanasi, Uttar Pradesh": {"temp": 28, "humidity": 70, "condition": "Hazy Sunshine", "rainfall_mm": 0.0, "wind_kmh": 7}
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

def get_weather_data(location: str = "Warangal, Telangana", lat: Optional[float] = None, lon: Optional[float] = None) -> Dict[str, Any]:
    """
    Fetches real weather from OpenWeatherMap API if key is present,
    otherwise uses regional meteorological references with clear attribution.
    """
    if OPENWEATHER_API_KEY and (lat is not None or location):
        try:
            if lat is not None and lon is not None:
                url = f"https://api.openweathermap.org/data/2.5/weather?lat={lat}&lon={lon}&units=metric&appid={OPENWEATHER_API_KEY}"
            else:
                city = location.split(",")[0].strip()
                url = f"https://api.openweathermap.org/data/2.5/weather?q={city}&units=metric&appid={OPENWEATHER_API_KEY}"
            
            resp = requests.get(url, timeout=4)
            if resp.status_code == 200:
                data = resp.json()
                temp = float(data["main"]["temp"])
                humidity = float(data["main"]["humidity"])
                rainfall_mm = float(data.get("rain", {}).get("1h", 0.0))
                desc = data["weather"][0]["description"].title()
                wind_kmh = round(float(data.get("wind", {}).get("speed", 0.0)) * 3.6, 1)

                risk_info = calculate_disease_risk(temp, humidity, rainfall_mm)
                
                return {
                    "source": "OpenWeatherMap Live API",
                    "is_live": True,
                    "location": data.get("name", location),
                    "temperature": round(temp, 1),
                    "humidity": int(humidity),
                    "condition": desc,
                    "rainfall_mm": rainfall_mm,
                    "wind_kmh": wind_kmh,
                    "disease_risk": risk_info
                }
        except Exception as e:
            print(f"[Avani Weather] Live API query failed: {e}. Falling back to regional agro profiles.")

    # Regional Agricultural Profile Fallback
    profile = REGIONAL_AGRO_PROFILES.get(location, REGIONAL_AGRO_PROFILES["Warangal, Telangana"])
    risk_info = calculate_disease_risk(profile["temp"], profile["humidity"], profile["rainfall_mm"])
    
    return {
        "source": "Regional Agricultural Reference Profile",
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
