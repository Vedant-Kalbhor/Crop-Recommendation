import joblib
import pandas as pd
import os
import requests
import time
from typing import List, Optional, Dict, Any


class GeocodingService:
    """Service to convert coordinates to region names using Nominatim API"""

    def __init__(self, user_agent: str = "CropRecommendationSystem/1.0"):
        self.base_url = "https://nominatim.openstreetmap.org/reverse"
        self.headers = {'User-Agent': user_agent}

    def coordinates_to_region(self, lat: float, lng: float) -> Dict[str, Any]:
        """Convert coordinates to region information using Nominatim API"""
        try:
            params = {
                'format': 'json',
                'lat': lat,
                'lon': lng,
                'zoom': 10,
                'addressdetails': 1
            }
            response = requests.get(
                self.base_url,
                params=params,
                headers=self.headers,
                timeout=10
            )
            response.raise_for_status()
            data = response.json()

            if 'error' in data:
                raise Exception(f"Geocoding error: {data['error']}")

            address = data.get('address', {})
            region_info = {
                'state': address.get('state'),
                'district': address.get('county') or address.get('district') or address.get('city'),
                'country': address.get('country'),
                'country_code': address.get('country_code'),
                'display_name': data.get('display_name', ''),
                'raw_address': address
            }

            time.sleep(1)  # respect Nominatim rate limit
            return region_info

        except requests.exceptions.RequestException as e:
            raise Exception(f"Geocoding service error: {str(e)}")


class CropRecommender:
    def __init__(self, model_path: str = 'ml-backend/saved_models/crop_recommender_model.joblib'):
        self.model_path = model_path
        self.crop_stats: Optional[Dict] = None
        self.geocoding_service = GeocodingService()
        self.df: Optional[pd.DataFrame] = None

    def _precompute_crop_statistics(self) -> Dict[str, Any]:
        """Compute aggregated statistics at crop, state, and district levels"""
        if self.df is None:
            raise ValueError("Dataframe not loaded. Please provide training data.")

        crop_means = self.df.groupby("Crop").mean(numeric_only=True)

        state_stats = (
            self.df.groupby(["State", "Crop"])
            .agg({"Area": "sum", "Production": "sum", "Yield": "mean"})
            .reset_index()
        )
        state_stats["Score"] = state_stats["Production"] / (state_stats["Area"] + 1)

        district_stats = (
            self.df.groupby(["District", "Crop"])
            .agg({"Area": "sum", "Production": "sum", "Yield": "mean"})
            .reset_index()
        )
        district_stats["Score"] = district_stats["Production"] / (district_stats["Area"] + 1)

        return {
            "crop_means": crop_means.to_dict(orient="index"),
            "state_list": self.df["State"].dropna().unique().tolist(),
            "district_list": self.df["District"].dropna().unique().tolist(),
            "crop_list": self.df["Crop"].dropna().unique().tolist(),
            "state_stats": state_stats,
            "district_stats": district_stats,
        }

    def save_model(self, model_path: str = None):
        """Save the trained crop recommender model and its stats"""
        path = model_path or self.model_path
        os.makedirs(os.path.dirname(path), exist_ok=True)
        joblib.dump(self.crop_stats, path)  # save raw dict
        print(f"✅ Crop recommendation model saved to {path}")

    def load_model(self, model_path: str = None):
        """Load the pre-trained model"""
        path = model_path or self.model_path
        if not os.path.exists(path):
            raise FileNotFoundError(f"Model file not found: {path}")
        self.crop_stats = joblib.load(path)  # load raw dict
        print(f"✅ Crop recommendation model loaded from {path}")


    def get_recommendations_by_region(self, region_name: str, top_n: int = 5):
        """Get crop recommendations for a state or district"""
        if not self.crop_stats:
            raise ValueError("Model not loaded. Call load_model() first.")

        region_name = region_name.strip().title()

        # State match
        if region_name in self.crop_stats['state_list']:
            state_data = self.crop_stats['state_stats'][self.crop_stats['state_stats']['State'] == region_name]
            if state_data.empty:
                return {"error": f"No data found for state: {region_name}"}

            top_crops = state_data.nlargest(top_n, 'Score')[['Crop', 'Area', 'Production', 'Yield', 'Score']]

            return {
                "region_type": "state",
                "region_name": region_name,
                "top_crops": top_crops.to_dict('records'),
                "total_area": state_data['Area'].sum(),
                "total_production": state_data['Production'].sum()
            }

        # District match
        if region_name in self.crop_stats['district_list']:
            district_data = self.crop_stats['district_stats'][self.crop_stats['district_stats']['District'] == region_name]
            if district_data.empty:
                return {"error": f"No data found for district: {region_name}"}

            top_crops = district_data.nlargest(top_n, 'Score')[['Crop', 'Area', 'Production', 'Yield', 'Score']]

            return {
                "region_type": "district",
                "region_name": region_name,
                "top_crops": top_crops.to_dict('records'),
                "total_area": district_data['Area'].sum(),
                "total_production": district_data['Production'].sum()
            }

        # Partial state matches
        state_matches = [s for s in self.crop_stats['state_list'] if region_name.lower() in s.lower()]
        if state_matches:
            return self.get_recommendations_by_region(state_matches[0], top_n)

        # Partial district matches
        district_matches = [d for d in self.crop_stats['district_list'] if region_name.lower() in d.lower()]
        if district_matches:
            return self.get_recommendations_by_region(district_matches[0], top_n)

        return {"error": f"No data found for region: {region_name}"}

    def get_recommendations_by_coordinates(self, lat: float, lng: float, top_n: int = 5):
        """Get crop recommendations based on coordinates using real geocoding"""
        try:
            if not (-90 <= lat <= 90) or not (-180 <= lng <= 180):
                return {"error": "Invalid coordinates provided"}

            region_info = self.geocoding_service.coordinates_to_region(lat, lng)
            recommendations = None

            if region_info.get('state'):
                state_name = self._find_best_match(region_info['state'], self.crop_stats['state_list'])
                if state_name:
                    recommendations = self.get_recommendations_by_region(state_name, top_n)
                    if 'error' not in recommendations:
                        recommendations['geocoded_info'] = region_info
                        return recommendations

            if region_info.get('district'):
                district_name = self._find_best_match(region_info['district'], self.crop_stats['district_list'])
                if district_name:
                    recommendations = self.get_recommendations_by_region(district_name, top_n)
                    if 'error' not in recommendations:
                        recommendations['geocoded_info'] = region_info
                        return recommendations

            return {
                "error": f"Could not find matching region for coordinates: {lat}, {lng}",
                "geocoded_info": region_info,
                "available_states": self.crop_stats['state_list'][:10],
                "suggestion": "Try using a specific state or district name from the available list"
            }

        except Exception as e:
            return {"error": f"Geocoding failed: {str(e)}"}

    def _find_best_match(self, search_term: str, options: List[str]) -> Optional[str]:
        """Find the best match for a search term in a list of options"""
        if not search_term or not options:
            return None

        search_term = search_term.lower().strip()

        for option in options:
            if option.lower() == search_term:
                return option
        for option in options:
            if search_term in option.lower():
                return option
        for option in options:
            if self._fuzzy_match(search_term, option.lower()):
                return option

        return None

    def _fuzzy_match(self, term1: str, term2: str, threshold: float = 0.7) -> bool:
        """Simple fuzzy matching between two strings"""
        term1 = term1.lower()
        term2 = term2.lower()

        if term1 in term2 or term2 in term1:
            return True

        words1 = set(term1.split())
        words2 = set(term2.split())
        if words1 & words2:
            return True

        common_chars = set(term1) & set(term2)
        similarity = len(common_chars) / max(len(set(term1)), len(set(term2)))
        return similarity >= threshold

    def get_available_states(self) -> List[str]:
        if not self.crop_stats:
            raise ValueError("Model not loaded. Call load_model() first.")
        return self.crop_stats['state_list']

    def get_available_districts(self, state: Optional[str] = None) -> List[str]:
        if not self.crop_stats:
            raise ValueError("Model not loaded. Call load_model() first.")

        if state:
            state_districts = self.crop_stats['district_stats'][
                self.crop_stats['district_stats']['State'] == state
            ]['District'].unique().tolist()
            return sorted(state_districts)
        else:
            return self.crop_stats['district_list']

    def get_available_crops(self) -> List[str]:
        if not self.crop_stats:
            raise ValueError("Model not loaded. Call load_model() first.")
        return self.crop_stats['crop_list']

    def search_regions(self, query: str, limit: int = 10) -> Dict[str, List[str]]:
        if not self.crop_stats:
            raise ValueError("Model not loaded. Call load_model() first.")

        query = query.lower().strip()

        matching_states = [
            state for state in self.crop_stats['state_list']
            if query in state.lower()
        ][:limit]

        matching_districts = [
            district for district in self.crop_stats['district_list']
            if query in district.lower()
        ][:limit]

        return {
            'states': matching_states,
            'districts': matching_districts
        }
