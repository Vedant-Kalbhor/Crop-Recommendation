import numpy as np
import pandas as pd
import joblib
import tensorflow as tf
from typing import List, Dict, Any
import os
import logging
from dotenv import load_dotenv

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

MODEL_PATH = os.getenv("MODEL_PATH", "saved_models")
DATA_PATH = os.getenv("DATA_PATH", "data")
REGION_DATA = os.getenv("REGION_DATA", "region_crop_dataset.csv")

class PredictionService:
    def __init__(self):
        self.rf_model = None
        self.cnn_model = None
        self.crop_label_encoder = None  # Changed from label_encoder
        self.region_label_encoder = None  # For region data if needed
        self.region_crop_data = None
        self.models_loaded = False
        self.feature_names = ['N', 'P', 'K', 'temperature', 'humidity', 'ph', 'rainfall']

    def load_models(self):
        """Load all models and data during startup"""
        try:
            rf_model_path = os.path.join(MODEL_PATH, "random_forest_model.pkl")
            cnn_model_path = os.path.join(MODEL_PATH, "soil_cnn_model.h5")
            crop_encoder_path = os.path.join(MODEL_PATH, "crop_label_encoder.pkl")  # Only this one
            region_data_path = os.path.join(DATA_PATH, REGION_DATA)

            logger.info("Loading models...")
            
            # Load Random Forest model and crop label encoder
            self.rf_model = joblib.load(rf_model_path)
            logger.info(f"Random Forest model loaded from {rf_model_path}")
            
            self.crop_label_encoder = joblib.load(crop_encoder_path)
            logger.info(f"Crop label encoder loaded from {crop_encoder_path}")
            logger.info(f"Available crop classes: {self.crop_label_encoder.classes_}")

            # Load CNN model
            self.cnn_model = tf.keras.models.load_model(cnn_model_path)
            logger.info(f"CNN model loaded from {cnn_model_path}")

            # Load region data (no encoder needed for region prediction)
            if os.path.exists(region_data_path):
                self.region_crop_data = pd.read_csv(region_data_path)
                logger.info(f"Region crop dataset loaded from {region_data_path}")
            else:
                logger.warning(f"Region crop dataset not found at {region_data_path}")
                self.region_crop_data = pd.DataFrame()

            self.models_loaded = True
            logger.info("✅ All models and data loaded successfully")

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
            
            # Ensure all required features are present and in correct order
            input_data = []
            
            for feature in self.feature_names:
                value = soil_params.get(feature)
                if value is None or value == '':
                    # Use default values
                    default_values = {
                        'N': 50.0, 'P': 50.0, 'K': 50.0,
                        'temperature': 25.0, 'humidity': 60.0,
                        'ph': 6.5, 'rainfall': 100.0
                    }
                    value = default_values.get(feature, 0.0)
                
                try:
                    input_data.append(float(value))
                except (ValueError, TypeError):
                    default_values = {
                        'N': 50.0, 'P': 50.0, 'K': 50.0,
                        'temperature': 25.0, 'humidity': 60.0,
                        'ph': 6.5, 'rainfall': 100.0
                    }
                    input_data.append(default_values.get(feature, 0.0))

            # Prepare input data as 2D array
            input_array = np.array([input_data])
            
            # Create DataFrame with correct feature names and order
            input_df = pd.DataFrame(input_array, columns=self.feature_names)
            logger.info(f"Input features: {dict(zip(self.feature_names, input_data))}")

            # Make prediction
            prediction = self.rf_model.predict(input_df)
            probabilities = self.rf_model.predict_proba(input_df)[0]

            # Decode prediction using CROP label encoder
            crop_name = self.crop_label_encoder.inverse_transform(prediction)[0]
            confidence = max(probabilities)

            # Get top 5 recommendations
            top_indices = np.argsort(probabilities)[-5:][::-1]
            top_crops = self.crop_label_encoder.inverse_transform(top_indices)
            top_confidences = probabilities[top_indices]

            recommendations = []
            for crop, conf in zip(top_crops, top_confidences):
                recommendations.append({
                    "crop": crop,
                    "confidence": float(conf),
                    "reason": f"High compatibility with soil parameters (confidence: {conf:.2f})"
                })

            return {
                "recommendations": recommendations,
                "method": "soil_params",
                "input_data": soil_params
            }

        except Exception as e:
            logger.error(f"Error in soil params prediction: {str(e)}")
            raise

    # ... rest of the methods remain the same

    def predict_from_soil_image(self, image_array: np.ndarray) -> Dict[str, Any]:
        self._check_models_loaded()
        try:
            # Preprocess image if needed (resize, normalize, etc.)
            if len(image_array.shape) == 3:
                image_array = np.expand_dims(image_array, axis=0)
            
            prediction = self.cnn_model.predict(image_array)
            predicted_class = np.argmax(prediction, axis=1)[0]
            confidence = prediction[0][predicted_class]

            soil_types = ['clay', 'sandy', 'loamy', 'silty', 'peaty', 'chalky']
            soil_type = soil_types[predicted_class]

            soil_crop_mapping = {
                'clay': ['Rice', 'Wheat', 'Cabbage', 'Broccoli', 'Brussels Sprouts'],
                'sandy': ['Carrot', 'Potato', 'Lettuce', 'Strawberry', 'Radish'],
                'loamy': ['Tomato', 'Corn', 'Soybean', 'Cotton', 'Pepper'],
                'silty': ['Wheat', 'Oats', 'Sugar Beet', 'Barley', 'Cabbage'],
                'peaty': ['Potato', 'Onion', 'Carrot', 'Lettuce', 'Celery'],
                'chalky': ['Spinach', 'Beets', 'Sweet Corn', 'Cabbage', 'Lilac']
            }

            recommended_crops = soil_crop_mapping.get(soil_type, [])
            recommendations = []
            for crop in recommended_crops[:3]:
                recommendations.append({
                    "crop": crop,
                    "confidence": float(confidence),
                    "reason": f"Thrives in {soil_type} soil conditions"
                })

            return {
                "recommendations": recommendations,
                "method": "soil_image",
                "soil_type": soil_type
            }

        except Exception as e:
            logger.error(f"Error in soil image prediction: {str(e)}")
            raise

    def predict_from_region(self, region: str, weather_data: Dict[str, float]) -> Dict[str, Any]:
        self._check_models_loaded()
        try:
            # Convert weather data values to float
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

            recommendations = []
            for crop in suitable_crops[:3]:
                recommendations.append({
                    "crop": crop.strip(),
                    "confidence": 0.8,
                    "reason": f"Commonly grown in {region} region with current weather conditions"
                })

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