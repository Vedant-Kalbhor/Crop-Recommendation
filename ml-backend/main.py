#!/usr/bin/env python3
"""
FastAPI app for Crop Recommendation ML API
- Soil params prediction
- Soil image prediction
- Region-based recommendations (using precomputed stats + metadata)
"""

from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import logging
from typing import List, Union
from datetime import datetime
from contextlib import asynccontextmanager
import joblib
import os

# Import local modules
from schemas.soil_params import SoilParams
from schemas.recommendation import RecommendationResponse
from services.prediction_service import PredictionService
from services.weather_service import WeatherService
from services.image_processing import ImageProcessingService
from utils.helpers import format_error
from utils.constants import SOIL_TYPES, CROP_CATEGORIES

# ------------------- LOGGING -------------------
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ------------------- SERVICES -------------------
prediction_service = PredictionService()
weather_service = WeatherService()
image_processing = ImageProcessingService()

# ------------------- REGION MODELS -------------------
MODEL_DIR = "./saved_models"
region_stats = None
region_metadata = None

# ------------------- GLOBAL FLAGS -------------------
models_loaded = False

# ------------------- LIFESPAN -------------------
@asynccontextmanager
async def lifespan(app: FastAPI):
    global models_loaded, region_stats, region_metadata
    try:
        # Load ML models
        logger.info("Loading ML models from PredictionService...")
        prediction_service.load_models()
        models_loaded = True
        logger.info("✅ ML models loaded successfully")

        # Load region stats + metadata
        stats_path = os.path.join(MODEL_DIR, "region_crop_stats.joblib")
        meta_path = os.path.join(MODEL_DIR, "region_metadata.joblib")

        if os.path.exists(stats_path):
            region_stats = joblib.load(stats_path)
            logger.info("✅ Loaded region_crop_stats")
        else:
            logger.warning("⚠️ region_crop_stats.joblib not found")

        if os.path.exists(meta_path):
            region_metadata = joblib.load(meta_path)
            logger.info("✅ Loaded region_metadata")
        else:
            logger.warning("⚠️ region_metadata.joblib not found")

    except Exception as e:
        logger.error(f"❌ Error during startup: {str(e)}")
        models_loaded = False

    yield
    logger.info("Shutting down application...")

# ------------------- APP INIT -------------------
app = FastAPI(
    title="Crop Recommendation ML API",
    description="Machine Learning API for crop recommendations based on soil parameters, images, and regional data",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ------------------- ROUTES -------------------

@app.get("/")
async def root():
    return {
        "message": "Crop Recommendation ML API",
        "version": "1.0.0",
        "status": {
            "models_loaded": models_loaded,
            "region_stats_loaded": region_stats is not None,
            "region_metadata_loaded": region_metadata is not None,
        },
        "endpoints": {
            "soil_params": "/predict/soil-params",
            "soil_image": "/predict/soil-image",
            "region": "/predict/region",
            "health": "/health",
            "soil_types": "/soil-types",
            "crop_categories": "/crop-categories",
            "available_states": "/available/states",
            "available_districts": "/available/districts"
        }
    }

@app.get("/health")
async def health_check():
    return {
        "status": "healthy" if models_loaded else "unhealthy",
        "models_loaded": models_loaded,
        "timestamp": datetime.now().isoformat()
    }

# ---------- Soil Params Prediction ----------
@app.post("/predict/soil-params")
@app.post("/batch-predict/soil-params")
async def predict_soil_params(soil_params: Union[SoilParams, List[SoilParams]]):
    try:
        if not models_loaded:
            raise HTTPException(status_code=503, detail="Models not loaded")

        if isinstance(soil_params, list):
            results = [
                prediction_service.predict_from_soil_params(params.dict())
                for params in soil_params
            ]
            return {"predictions": results, "count": len(results)}
        else:
            return prediction_service.predict_from_soil_params(soil_params.dict())
    except Exception as e:
        logger.error(f"Error in soil params prediction: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/batch-predict/soil-params")
async def batch_predict_soil_params(soil_params_list: List[SoilParams]):
    try:
        if not models_loaded:
            raise HTTPException(status_code=503, detail="Models not loaded")

        results = [
            prediction_service.predict_from_soil_params(params.dict())
            for params in soil_params_list
        ]
        return {"predictions": results, "count": len(results)}
    except Exception as e:
        logger.error(f"Error in batch prediction: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# ---------- Soil Image Prediction ----------
@app.post("/predict/soil-image", response_model=RecommendationResponse)
async def predict_soil_image(file: UploadFile = File(...)):
    try:
        if not models_loaded:
            raise HTTPException(status_code=503, detail="Models not loaded")

        if not file.content_type.startswith('image/'):
            raise HTTPException(status_code=400, detail="File must be an image")

        image_data = await file.read()
        if len(image_data) > 5 * 1024 * 1024:
            raise HTTPException(status_code=413, detail="File size exceeds 5MB limit")

        processed_image = await image_processing.process_image(image_data)
        return prediction_service.predict_from_soil_image(processed_image)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in soil image prediction: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# ---------- Region Prediction (UPDATED) ----------
@app.post("/predict/region")
async def predict_region(data: dict):
    if region_stats is None:
        raise HTTPException(status_code=503, detail="Region model not loaded")

    region = data.get("region")
    district = data.get("district")

    if not region:
        raise HTTPException(status_code=400, detail="Region (state) is required")

    # Key for lookup
    key = (region,) if not district else (region, district)
    if key not in region_stats:
        raise HTTPException(status_code=404, detail="Region/district not found in dataset")

    crop_dict = region_stats[key]
    if not crop_dict:
        return {"region": region, "district": district, "recommendations": []}

    # Sort crops by production and pick top 5
    sorted_crops = sorted(crop_dict.items(), key=lambda x: x[1], reverse=True)[:5]

    recommendations = [
        {
            "crop": crop,
            "confidence": 0.8,  # static for now
            "reason": f"Top crop in {region}{' - ' + district if district else ''} "
                      f"(Production: {int(prod)})"
        }
        for crop, prod in sorted_crops
    ]

    return {"region": region, "district": district, "recommendations": recommendations}

# ---------- Available States/Districts ----------
@app.get("/available/states")
async def get_available_states():
    if region_metadata is None:
        raise HTTPException(status_code=503, detail="Metadata not loaded")
    return {"states": sorted(region_metadata.keys())}

@app.get("/available/districts")
async def get_available_districts(state: str):
    if region_metadata is None:
        raise HTTPException(status_code=503, detail="Metadata not loaded")
    if state not in region_metadata:
        raise HTTPException(status_code=404, detail="State not found")
    return {"districts": region_metadata[state]}

# ---------- Static Info ----------
@app.get("/soil-types")
async def get_soil_types():
    return {"soil_types": SOIL_TYPES, "count": len(SOIL_TYPES)}

@app.get("/crop-categories")
async def get_crop_categories():
    return {"categories": CROP_CATEGORIES, "count": len(CROP_CATEGORIES)}

# ------------------- ERROR HANDLERS -------------------
@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    return JSONResponse(
        status_code=exc.status_code,
        content=format_error(exc.detail, exc.status_code)
    )

@app.exception_handler(Exception)
async def general_exception_handler(request, exc):
    logger.error(f"Unhandled exception: {str(exc)}")
    return JSONResponse(
        status_code=500,
        content=format_error("Internal server error", 500)
    )

# ------------------- ENTRY POINT -------------------
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8000,
        log_level="info",
        reload=True
    )
