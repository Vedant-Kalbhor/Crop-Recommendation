import requests
import os
from typing import Dict, Optional
import logging
from datetime import datetime

logger = logging.getLogger(__name__)

class WeatherService:
    def __init__(self):
        self.api_key = os.getenv('WEATHER_API_KEY', 'your_weather_api_key_here')
        self.base_url = "https://api.openweathermap.org/data/2.5"
    
    def get_weather_by_coords(self, lat: float, lon: float) -> Dict[str, float]:
        """Get weather data by coordinates using OpenWeatherMap API"""
        try:
            url = f"{self.base_url}/weather?lat={lat}&lon={lon}&appid={self.api_key}&units=metric"
            response = requests.get(url, timeout=10)
            response.raise_for_status()
            data = response.json()
            
            return {
                'temperature': data['main']['temp'],
                'humidity': data['main']['humidity'],
                'rainfall': data.get('rain', {}).get('1h', 0) if 'rain' in data else 0,
                'description': data['weather'][0]['description'],
                'location': data.get('name'),
                'country': data['sys']['country'],
                'timestamp': datetime.now().isoformat()
            }
        except requests.exceptions.RequestException as e:
            logger.warning(f"Weather API request failed: {str(e)}")
            # Return default values if API fails
            return self._get_default_weather_data()
        except Exception as e:
            logger.error(f"Error fetching weather data: {str(e)}")
            return self._get_default_weather_data()
    
    def get_weather_by_region(self, region: str) -> Dict[str, float]:
        """Get weather data by region name using OpenWeatherMap API"""
        try:
            url = f"{self.base_url}/weather?q={region}&appid={self.api_key}&units=metric"
            response = requests.get(url, timeout=10)
            response.raise_for_status()
            data = response.json()
            
            return {
                'temperature': data['main']['temp'],
                'humidity': data['main']['humidity'],
                'rainfall': data.get('rain', {}).get('1h', 0) if 'rain' in data else 0,
                'description': data['weather'][0]['description'],
                'location': data.get('name'),
                'country': data['sys']['country'],
                'timestamp': datetime.now().isoformat()
            }
        except requests.exceptions.RequestException as e:
            logger.warning(f"Weather API request failed for region {region}: {str(e)}")
            return self._get_default_weather_data()
        except Exception as e:
            logger.error(f"Error fetching weather data for region {region}: {str(e)}")
            return self._get_default_weather_data()
    
    def get_region_from_coords(self, lat: float, lon: float) -> str:
        """Get region name from coordinates using reverse geocoding"""
        try:
            url = f"http://api.openweathermap.org/geo/1.0/reverse?lat={lat}&lon={lon}&limit=1&appid={self.api_key}"
            response = requests.get(url, timeout=5)
            response.raise_for_status()
            data = response.json()
            
            if data and len(data) > 0:
                return data[0].get('name', 'Unknown Region')
            return 'Unknown Region'
        except Exception as e:
            logger.warning(f"Reverse geocoding failed: {str(e)}")
            return 'Unknown Region'
    
    def _get_default_weather_data(self) -> Dict[str, float]:
        """Return default weather data when API fails"""
        return {
            'temperature': 25.0,
            'humidity': 60.0,
            'rainfall': 0.0,
            'description': 'clear sky',
            'location': 'Unknown',
            'country': 'Unknown',
            'timestamp': datetime.now().isoformat()
        }