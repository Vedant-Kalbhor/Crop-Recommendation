#!/usr/bin/env python3
"""
Wrapper script to train and save the crop recommendation model.
Forwards execution into ml_models/train_region.py
"""

import os
import sys
import runpy

if __name__ == "__main__":
    # Ensure ml-backend (this folder) is on sys.path
    BASE_DIR = os.path.dirname(__file__)
    if BASE_DIR not in sys.path:
        sys.path.insert(0, BASE_DIR)

    # Path to the actual training script
    script_path = os.path.join(BASE_DIR, "ml_models", "train_region.py")

    # Run the real script
    runpy.run_path(script_path, run_name="__main__")
