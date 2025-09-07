#!/usr/bin/env python3
"""
Script to preprocess region–crop dataset and save summary stats + metadata
"""

import os
import sys
import logging
import pandas as pd
import joblib
from collections import defaultdict

# Paths
DATA_PATH = "ml-backend/data/India_Agriculture_Crop_Production.csv"
SAVE_DIR = "ml-backend/saved_models"

# Logging setup
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Ensure save directory exists
os.makedirs(SAVE_DIR, exist_ok=True)


def train_region_model():
    """Load dataset, preprocess, and save region-level crop stats + metadata"""
    try:
        logger.info(f"📂 Loading dataset from {DATA_PATH}...")
        df = pd.read_csv(DATA_PATH)

        # Normalize column names (dataset versions differ)
        df.columns = [c.strip().lower() for c in df.columns]

        # Ensure required columns exist
        required_cols = ["state", "district", "crop", "production"]
        if not all(col in df.columns for col in required_cols):
            raise ValueError(f"Dataset must have columns: {', '.join(required_cols)}")

        # Clean data
        df = df.dropna(subset=required_cols)
        df["production"] = pd.to_numeric(df["production"], errors="coerce").fillna(0)

        logger.info(f"✅ Data cleaned. {len(df)} valid records remaining.")

        # Build crop stats per state & district
        region_crop_stats = defaultdict(lambda: defaultdict(int))
        state_districts = defaultdict(set)

        for _, row in df.iterrows():
            state = str(row["state"]).strip()
            district = str(row["district"]).strip()
            crop = str(row["crop"]).strip()
            prod = float(row["production"])

            key_state = (state,)
            key_district = (state, district)

            region_crop_stats[key_state][crop] += prod
            region_crop_stats[key_district][crop] += prod

            state_districts[state].add(district)

        # Save region crop stats
        stats_path = os.path.join(SAVE_DIR, "region_crop_stats.joblib")
        joblib.dump(dict(region_crop_stats), stats_path)

        # Save metadata (states → districts)
        metadata_path = os.path.join(SAVE_DIR, "region_metadata.joblib")
        state_metadata = {state: sorted(list(districts)) for state, districts in state_districts.items()}
        joblib.dump(state_metadata, metadata_path)

        logger.info(f"🎉 Saved region_crop_stats.joblib and region_metadata.joblib in {SAVE_DIR}")
        return True

    except Exception as e:
        logger.error(f"❌ Error in training region model: {str(e)}")
        return False


if __name__ == "__main__":
    if not os.path.exists(DATA_PATH):
        logger.error(f"❌ Data file {DATA_PATH} not found!")
        sys.exit(1)

    success = train_region_model()
    sys.exit(0 if success else 1)
