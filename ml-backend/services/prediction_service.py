import numpy as np
import pandas as pd
import joblib
import tensorflow as tf
import os
import logging
from dotenv import load_dotenv
from typing import List, Dict, Any

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

MODEL_PATH = os.getenv("MODEL_PATH", "ml-backend/saved_models")
DATA_PATH = os.getenv("DATA_PATH", "ml-backend/data")
REGION_DATA = os.getenv("REGION_DATA", "region_crop_dataset.csv")

class PredictionService:
    def __init__(self):
        self.rf_model = None
        self.cnn_model = None
        self.crop_label_encoder = None
        self.region_crop_data = None
        self.models_loaded = False
        self.feature_names = ['N', 'P', 'K', 'temperature', 'humidity', 'ph', 'rainfall']

        # ✅ Currently only 4 classes (expand later to 8)
        self.soil_classes = [
            'Alluvial_Soil',
            'Black_Soil',
            'Clay_Soil',
            'Red_Soil'
        ]

    def load_models(self):
        """Load all models and data during startup"""
        try:
            rf_model_path = os.path.join(MODEL_PATH, "random_forest_model.pkl")
            cnn_model_path = os.path.join(MODEL_PATH, "cnn_soil_model.h5")
            crop_encoder_path = os.path.join(MODEL_PATH, "crop_label_encoder.pkl")
            region_data_path = os.path.join(DATA_PATH, REGION_DATA)

            logger.info("Loading models...")

            self.rf_model = joblib.load(rf_model_path)
            self.crop_label_encoder = joblib.load(crop_encoder_path)

            self.cnn_model = tf.keras.models.load_model(cnn_model_path)
            logger.info(f"CNN model loaded from {cnn_model_path}")

            if os.path.exists(region_data_path):
                self.region_crop_data = pd.read_csv(region_data_path)
            else:
                self.region_crop_data = pd.DataFrame()

            self.models_loaded = True
            logger.info("✅ All models loaded successfully")

        except Exception as e:
            logger.error(f"❌ Error loading models: {e}")
            self.models_loaded = False
            raise RuntimeError("Models not loaded. Check paths and files.")

    def _check_models_loaded(self):
        if not self.models_loaded:
            raise RuntimeError("Models not loaded. Please check model loading step.")

    def predict_from_soil_params(self, soil_params: Dict[str, Any]) -> Dict[str, Any]:
        """Predict crop from soil parameters using Random Forest"""
        try:
            self._check_models_loaded()

            input_data = []
            default_values = {
                'N': 50.0, 'P': 50.0, 'K': 50.0,
                'temperature': 25.0, 'humidity': 60.0,
                'ph': 6.5, 'rainfall': 100.0
            }

            for feature in self.feature_names:
                value = soil_params.get(feature, default_values[feature])
                try:
                    input_data.append(float(value))
                except (ValueError, TypeError):
                    input_data.append(default_values[feature])

            input_array = np.array([input_data])
            input_df = pd.DataFrame(input_array, columns=self.feature_names)
            logger.info(f"Input features: {dict(zip(self.feature_names, input_data))}")

            prediction = self.rf_model.predict(input_df)
            probabilities = self.rf_model.predict_proba(input_df)[0]

            crop_name = self.crop_label_encoder.inverse_transform(prediction)[0]
            confidence = max(probabilities)

            top_indices = np.argsort(probabilities)[-5:][::-1]
            top_crops = self.crop_label_encoder.inverse_transform(top_indices)
            top_confidences = probabilities[top_indices]

            recommendations = [
                {
                    "crop": crop,
                    "confidence": float(conf),
                    "reason": f"High compatibility with soil parameters (confidence: {conf:.2f})"
                }
                for crop, conf in zip(top_crops, top_confidences)
            ]

            return {
                "recommendations": recommendations,
                "method": "soil_params",
                "input_data": soil_params
            }

        except Exception as e:
            logger.error(f"Error in soil params prediction: {str(e)}")
            raise

    def predict_from_soil_image(self, image_array: np.ndarray) -> Dict[str, Any]:
        """Predict soil type and crops from soil image using CNN"""
        try:
            if self.cnn_model is None:
                return self._fallback_soil_prediction()

            prediction = self.cnn_model.predict(image_array)
            predicted_class_index = np.argmax(prediction, axis=1)[0]
            confidence = float(prediction[0][predicted_class_index])

            soil_type = self.soil_classes[predicted_class_index]

            soil_crop_mapping = {
                'Alluvial_Soil': ['Rice', 'Wheat', 'Sugarcane', 'Maize', 'Cotton'],
                'Black_Soil': ['Cotton', 'Soybean', 'Citrus', 'Sunflower', 'Groundnut'],
                'Clay_Soil': ['Rice', 'Wheat', 'Cabbage', 'Broccoli'],
                'Red_Soil': ['Millets', 'Pulses', 'Groundnut', 'Cotton']
            }

            recommended_crops = soil_crop_mapping.get(soil_type, [])
            recommendations = [
                {
                    "crop": crop,
                    "confidence": confidence,
                    "reason": f"Thrives in {soil_type} soil conditions"
                }
                for crop in recommended_crops[:3]
            ]

            return {
                "recommendations": recommendations,
                "method": "soil_image",
                "soil_type": soil_type
            }

        except Exception as e:
            logger.error(f"Error in soil image prediction: {str(e)}")
            return self._fallback_soil_prediction()

    def _fallback_soil_prediction(self) -> Dict[str, Any]:
        return {
            "recommendations": [
                {"crop": "Rice", "confidence": 0.6, "reason": "General fallback crop"},
                {"crop": "Wheat", "confidence": 0.5, "reason": "General fallback crop"},
                {"crop": "Sugarcane", "confidence": 0.4, "reason": "General fallback crop"}
            ],
            "method": "soil_image",
            "soil_type": "unknown"
        }

    def predict_from_region(self, region: str, weather_data: Dict[str, float]) -> Dict[str, Any]:
        self._check_models_loaded()
        try:
            weather_data_float = {}
            for key, value in weather_data.items():
                try:
                    weather_data_float[key] = float(value)
                except (ValueError, TypeError):
                    weather_data_float[key] = 0.0

            suitable_crops = []
            if not self.region_crop_data.empty:
                region_crops = self.region_crop_data[
                    self.region_crop_data['region'].str.lower() == region.lower()
                ]
                if not region_crops.empty:
                    suitable_crops = region_crops['crops'].iloc[0].split(',')
                else:
                    suitable_crops = self._filter_crops_by_weather(weather_data_float)
            else:
                suitable_crops = self._filter_crops_by_weather(weather_data_float)

            recommendations = [
                {
                    "crop": crop.strip(),
                    "confidence": 0.8,
                    "reason": f"Commonly grown in {region} region with current weather conditions"
                }
                for crop in suitable_crops[:3]
            ]

            return {
                "recommendations": recommendations,
                "method": "region",
                "region": region,
                "weather_data": weather_data_float
            }

        except Exception as e:
            logger.error(f"Error in region prediction: {str(e)}")
            raise

    def _filter_crops_by_weather(self, weather_data: Dict[str, float]) -> List[str]:
        try:
            temp = float(weather_data.get('temperature', 0))
            rainfall = float(weather_data.get('rainfall', 0))

            if temp > 28 and rainfall > 150:
                return ['Rice', 'Sugarcane', 'Banana', 'Taro', 'Watermelon']
            elif 22 <= temp <= 28 and 100 <= rainfall <= 150:
                return ['Cotton', 'Maize', 'Soybean', 'Groundnut', 'Sunflower']
            elif 15 <= temp <= 22 and 50 <= rainfall <= 100:
                return ['Wheat', 'Barley', 'Oats', 'Potato', 'Peas']
            elif temp < 15 and rainfall < 50:
                return ['Millet', 'Sorghum', 'Chickpea', 'Lentil', 'Mustard']
            else:
                return ['Tomato', 'Onion', 'Chilli', 'Brinjal', 'Cucumber']
        except (ValueError, TypeError):
            return ['Tomato', 'Onion', 'Chilli', 'Brinjal', 'Cucumber']
