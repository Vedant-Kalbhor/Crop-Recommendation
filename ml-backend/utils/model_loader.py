import joblib
import tensorflow as tf
import pandas as pd
import os
from typing import Optional
import logging

logger = logging.getLogger(__name__)

class ModelLoader:
    def __init__(self):
        self.rf_model = None
        self.cnn_model = None
        self.label_encoder = None
        self.region_crop_data = None
        
    async def load_models(self):
        """Load all ML models and data"""
        try:
            # model_path = os.getenv('MODEL_PATH', './saved_models')
            # data_path = os.getenv('DATA_PATH', './data')
            model_path = os.getenv('MODEL_PATH')
            data_path = os.getenv('DATA_PATH')
            
            # Load Random Forest model
            rf_model_path = os.path.join(model_path, 'random_forest_model.pkl')
            if os.path.exists(rf_model_path):
                self.rf_model = joblib.load(rf_model_path)
                logger.info("Random Forest model loaded successfully")
            else:
                logger.warning(f"Random Forest model not found at {rf_model_path}")
            
            # Load CNN model
            cnn_model_path = os.path.join(model_path, 'cnn_soil_model.h5')
            if os.path.exists(cnn_model_path):
                self.cnn_model = tf.keras.models.load_model(cnn_model_path)
                logger.info("CNN model loaded successfully")
            else:
                logger.warning(f"CNN model not found at {cnn_model_path}")
            
            # Load label encoder
            label_encoder_path = os.path.join(model_path, 'label_encoders.pkl')
            if os.path.exists(label_encoder_path):
                self.label_encoder = joblib.load(label_encoder_path)
                logger.info("Label encoder loaded successfully")
            else:
                logger.warning(f"Label encoder not found at {label_encoder_path}")
            
            # Load region crop data
            region_data_file = os.getenv('REGION_DATA', 'region_crop_dataset.csv')
            region_data_path = os.path.join(data_path, region_data_file)
            if os.path.exists(region_data_path):
                self.region_crop_data = pd.read_csv(region_data_path)
                logger.info(f"Region crop data loaded with {len(self.region_crop_data)} rows")
            else:
                logger.warning(f"Region crop data not found at {region_data_path}")
                
        except Exception as e:
            logger.error(f"Error loading models: {str(e)}")
            raise
    
    def get_model_info(self) -> dict:
        """Get information about loaded models"""
        return {
            'random_forest_loaded': self.rf_model is not None,
            'cnn_loaded': self.cnn_model is not None,
            'label_encoder_loaded': self.label_encoder is not None,
            'region_data_loaded': self.region_crop_data is not None,
            'region_data_rows': len(self.region_crop_data) if self.region_crop_data is not None else 0
        }