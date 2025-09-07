import joblib
import tensorflow as tf
import pandas as pd
import os
import logging

logger = logging.getLogger(__name__)

class ModelLoader:
    def __init__(self):
        self.rf_model = None
        self.cnn_model = None
        self.label_encoder = None
        self.region_crop_stats = None  # ✅ now loading joblib instead of CSV

    async def load_models(self):
        """Load all ML models and region–crop stats"""
        try:
            model_path = os.getenv("MODEL_PATH", "./saved_models")
            data_path = os.getenv("DATA_PATH", "./data")

            # ------------------- Random Forest model -------------------
            rf_model_path = os.path.join(model_path, "random_forest_model.pkl")
            if os.path.exists(rf_model_path):
                self.rf_model = joblib.load(rf_model_path)
                logger.info("✅ Random Forest model loaded successfully")
            else:
                logger.warning(f"⚠️ Random Forest model not found at {rf_model_path}")

            # ------------------- CNN model -------------------
            cnn_model_path = os.path.join(model_path, "cnn_soil_model.h5")
            if os.path.exists(cnn_model_path):
                self.cnn_model = tf.keras.models.load_model(cnn_model_path)
                logger.info("✅ CNN model loaded successfully")
            else:
                logger.warning(f"⚠️ CNN model not found at {cnn_model_path}")

            # ------------------- Label Encoder -------------------
            label_encoder_path = os.path.join(model_path, "crop_label_encoder.pkl")
            if os.path.exists(label_encoder_path):
                self.label_encoder = joblib.load(label_encoder_path)
                logger.info("✅ Label encoder loaded successfully")
            else:
                logger.warning(f"⚠️ Label encoder not found at {label_encoder_path}")

            # ------------------- Region Crop Stats -------------------
            region_stats_path = os.path.join(model_path, "region_crop_stats.joblib")
            if os.path.exists(region_stats_path):
                self.region_crop_stats = joblib.load(region_stats_path)
                if isinstance(self.region_crop_stats, pd.DataFrame):
                    logger.info(
                        f"✅ Region–crop stats loaded successfully with {len(self.region_crop_stats)} rows"
                    )
                else:
                    logger.warning(
                        f"⚠️ region_crop_stats.joblib loaded but not a DataFrame, type: {type(self.region_crop_stats)}"
                    )
                    self.region_crop_stats = None
            else:
                logger.warning(f"⚠️ Region–crop stats not found at {region_stats_path}")

        except Exception as e:
            logger.error(f"❌ Error loading models: {str(e)}")
            raise

    def get_model_info(self) -> dict:
        """Get information about loaded models"""
        return {
            "random_forest_loaded": self.rf_model is not None,
            "cnn_loaded": self.cnn_model is not None,
            "label_encoder_loaded": self.label_encoder is not None,
            "region_stats_loaded": self.region_crop_stats is not None,
            "region_stats_rows": len(self.region_crop_stats)
            if isinstance(self.region_crop_stats, pd.DataFrame)
            else 0,
        }
