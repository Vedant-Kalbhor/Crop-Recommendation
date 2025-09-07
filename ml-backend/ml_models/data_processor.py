import joblib
import pandas as pd
import os
import logging

logger = logging.getLogger(__name__)

class DataProcessor:
    def __init__(self, stats_file="ml-backend/saved_models/region_crop_stats.joblib"):
        self.stats_file = stats_file
        self.df = None

    def load_and_preprocess_data(self):
        """Load precomputed region–crop stats from joblib"""
        if not os.path.exists(self.stats_file):
            logger.error(f"Region stats file not found at {self.stats_file}")
            raise FileNotFoundError(f"No such file: {self.stats_file}")

        self.df = joblib.load(self.stats_file)

        if not isinstance(self.df, pd.DataFrame):
            logger.error("Loaded object is not a DataFrame")
            raise ValueError("Region stats file is invalid")

        logger.info(f"✅ Region–crop stats loaded with {len(self.df)} rows")
        return self.df

    def get_available_states(self):
        if self.df is None:
            self.load_and_preprocess_data()
        return sorted(self.df["State"].unique().tolist())

    def get_available_districts(self, state=None):
        if self.df is None:
            self.load_and_preprocess_data()
        if state:
            return sorted(self.df[self.df["State"] == state]["District"].unique().tolist())
        return sorted(self.df["District"].unique().tolist())

    def get_available_crops(self):
        if self.df is None:
            self.load_and_preprocess_data()
        return sorted(self.df["Crop"].unique().tolist())
