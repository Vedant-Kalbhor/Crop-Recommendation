#!/usr/bin/env python3
"""
Script to train and save the crop recommendation model
"""
import os
import sys
import logging

from crop_recommender import CropRecommender
from data_processor import DataProcessor

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def train_and_save_model(data_file, model_save_path):
    """Train the crop recommendation model and save it"""
    try:
        logger.info(f"Loading and processing data from {data_file}...")

        processor = DataProcessor(data_file)
        df = processor.load_and_preprocess_data()
        logger.info(f"Data processed successfully. {len(df)} records loaded.")

        recommender = CropRecommender()
        recommender.data_processor = processor
        recommender.df = df

        logger.info("Precomputing crop statistics...")
        recommender.crop_stats = recommender._precompute_crop_statistics()

        logger.info("Saving model...")
        recommender.save_model(model_save_path)

        logger.info(f"✅ Model successfully trained and saved to {model_save_path}")
        return True

    except Exception as e:
        logger.error(f"❌ Error training model: {str(e)}")
        return False


if __name__ == "__main__":
    DATA_FILE = "ml-backend/data/India_Agriculture_Crop_Production.csv"
    MODEL_PATH = "ml-backend/saved_models/crop_recommender_model.joblib"

    if not os.path.exists(DATA_FILE):
        logger.error(f"Data file {DATA_FILE} not found!")
        sys.exit(1)

    success = train_and_save_model(DATA_FILE, MODEL_PATH)

    if success:
        logger.info("Model training completed successfully!")
        sys.exit(0)
    else:
        logger.error("Model training failed!")
        sys.exit(1)
