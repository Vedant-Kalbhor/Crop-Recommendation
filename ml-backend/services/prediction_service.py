import numpy as np
import pandas as pd
import joblib
import tensorflow as tf
import os
import logging
from dotenv import load_dotenv
from typing import List, Dict, Any

from services.data_processor import DataProcessor

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

MODEL_PATH = os.getenv("MODEL_PATH", "ml-backend/saved_models")

class PredictionService:
    def __init__(self):
        self.rf_model = None
        self.cnn_model = None
        self.crop_label_encoder = None
        self.region_stats = None  # ✅ joblib-based stats
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
        """Load all models and region–crop stats"""
        try:
            rf_model_path = os.path.join(MODEL_PATH, "random_forest_model.pkl")
            cnn_model_path = os.path.join(MODEL_PATH, "cnn_soil_model.h5")
            crop_encoder_path = os.path.join(MODEL_PATH, "crop_label_encoder.pkl")
            region_stats_path = os.path.join(MODEL_PATH, "region_crop_stats.joblib")

            logger.info("Loading models...")

            # Random Forest
            if os.path.exists(rf_model_path):
                self.rf_model = joblib.load(rf_model_path)
                logger.info("Random Forest model loaded")
            else:
                logger.warning(f"RF model not found at {rf_model_path}")

            # Label Encoder
            if os.path.exists(crop_encoder_path):
                self.crop_label_encoder = joblib.load(crop_encoder_path)
                logger.info("Crop label encoder loaded")
            else:
                logger.warning(f"Label encoder not found at {crop_encoder_path}")

            # CNN
            if os.path.exists(cnn_model_path):
                self.cnn_model = tf.keras.models.load_model(cnn_model_path)
                logger.info(f"CNN model loaded from {cnn_model_path}")
            else:
                logger.warning(f"CNN model not found at {cnn_model_path}")

            # Region–Crop Stats
            if os.path.exists(region_stats_path):
                self.region_stats = joblib.load(region_stats_path)
                if isinstance(self.region_stats, pd.DataFrame):
                    logger.info(f"Region–crop stats loaded with {len(self.region_stats)} rows")
                else:
                    logger.error("Region stats file is invalid (not DataFrame)")
                    self.region_stats = None
            else:
                logger.warning(f"Region stats not found at {region_stats_path}")

            self.models_loaded = True
            logger.info("✅ All models and region mappings loaded successfully")

        except Exception as e:
            logger.error(f"❌ Error loading models: {e}")
            self.models_loaded = False
            raise RuntimeError("Models not loaded. Check paths and files.")

    def _check_models_loaded(self):
        if not self.models_loaded:
            raise RuntimeError("Models not loaded. Please check model loading step.")

    # ---------------- Soil Params ----------------
    def predict_from_soil_params(self, soil_params: Dict[str, Any]) -> Dict[str, Any]:
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

    # ---------------- Soil Image ----------------
    def predict_from_soil_image(self, image_array: np.ndarray) -> Dict[str, Any]:
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

    # ---------------- Region ----------------
    def predict_from_region(self, region: str, weather_data: Dict[str, float]) -> Dict[str, Any]:
        self._check_models_loaded()
        try:
            if self.region_stats is None:
                raise RuntimeError("Region stats not loaded")

            df = self.region_stats
            region_df = df[df["State"].str.lower() == region.lower()]

            if region_df.empty:
                return {
                    "recommendations": [],
                    "method": "region",
                    "region": region,
                    "weather_data": weather_data,
                    "error": "Region not found in dataset"
                }

            # Rank crops by total production
            top_crops = (
                region_df.groupby("Crop")
                .agg({"Area": "sum", "Production": "sum", "Yield": "mean"})
                .reset_index()
                .sort_values("Production", ascending=False)
                .head(5)
            )

            recommendations = [
                {
                    "crop": row["Crop"],
                    "confidence": 0.8,
                    "reason": f"Top crop in {region} based on historical data (Production: {row['Production']:.0f} tonnes)"
                }
                for _, row in top_crops.iterrows()
            ]

            return {
                "recommendations": recommendations,
                "method": "region",
                "region": region,
                "weather_data": weather_data
            }

        except Exception as e:
            logger.error(f"Error in region prediction: {str(e)}")
            raise
