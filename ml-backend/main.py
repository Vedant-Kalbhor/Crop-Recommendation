# from fastapi import FastAPI, File, UploadFile, HTTPException
# from fastapi.middleware.cors import CORSMiddleware
# from fastapi.responses import JSONResponse
# import logging
# from typing import List
# from datetime import datetime
# from contextlib import asynccontextmanager
# from typing import Union

# # Import local modules
# from schemas.soil_params import SoilParams
# from schemas.recommendation import RecommendationResponse
# from services.prediction_service import PredictionService
# from services.weather_service import WeatherService
# from services.image_processing import ImageProcessingService
# from utils.helpers import format_error
# from utils.constants import SOIL_TYPES, CROP_CATEGORIES

# # Configure logging
# logging.basicConfig(level=logging.INFO)
# logger = logging.getLogger(__name__)

# # Initialize services
# prediction_service = PredictionService()
# weather_service = WeatherService()
# image_processing = ImageProcessingService()

# # Global flag for models
# models_loaded = False

# # Lifespan for loading models at startup
# @asynccontextmanager
# async def lifespan(app: FastAPI):
#     global models_loaded
#     try:
#         logger.info("Loading ML models from PredictionService...")
#         prediction_service.load_models()  # Synchronous load
#         models_loaded = True
#         logger.info("✅ ML models loaded successfully")
#     except Exception as e:
#         logger.error(f"❌ Error loading models: {str(e)}")
#         models_loaded = False
#     yield
#     # Optional: Cleanup on shutdown
#     logger.info("Shutting down application...")

# # Initialize FastAPI app with lifespan
# app = FastAPI(
#     title="Crop Recommendation ML API",
#     description="Machine Learning API for crop recommendations based on soil parameters, images, and regional data",
#     version="1.0.0",
#     docs_url="/docs",
#     redoc_url="/redoc",
#     lifespan=lifespan
# )

# # Enable CORS
# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=["*"],
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )

# # ------------------- ROUTES -------------------

# @app.get("/")
# async def root():
#     return {
#         "message": "Crop Recommendation ML API",
#         "version": "1.0.0",
#         "status": "operational" if models_loaded else "models_not_loaded",
#         "endpoints": {
#             "soil_params": "/predict/soil-params",
#             "soil_image": "/predict/soil-image",
#             "region": "/predict/region",
#             "health": "/health",
#             "soil_types": "/soil-types",
#             "crop_categories": "/crop-categories"
#         }
#     }

# @app.get("/health")
# async def health_check():
#     return {
#         "status": "healthy" if models_loaded else "unhealthy",
#         "models_loaded": models_loaded,
#         "timestamp": datetime.now().isoformat()
#     }

# @app.post("/predict/soil-params")
# @app.post("/batch-predict/soil-params")
# async def predict_soil_params(soil_params: Union[SoilParams, List[SoilParams]]):
#     """
#     Handles both single and batch predictions
#     """
#     try:
#         if not models_loaded:
#             raise HTTPException(status_code=503, detail="Models not loaded")
        
#         # Check if it's a single object or list
#         if isinstance(soil_params, list):
#             # Batch prediction
#             results = [
#                 prediction_service.predict_from_soil_params(params.dict())
#                 for params in soil_params
#             ]
#             return {
#                 "predictions": results,
#                 "count": len(results)
#             }
#         else:
#             # Single prediction
#             result = prediction_service.predict_from_soil_params(soil_params.dict())
#             return result
            
#     except Exception as e:
#         logger.error(f"Error in soil params prediction: {str(e)}")
#         raise HTTPException(status_code=500, detail=str(e))

# @app.post("/batch-predict/soil-params")
# async def batch_predict_soil_params(soil_params_list: List[SoilParams]):
#     try:
#         if not models_loaded:
#             raise HTTPException(status_code=503, detail="Models not loaded")

#         results = [
#             prediction_service.predict_from_soil_params(params.dict())
#             for params in soil_params_list
#         ]

#         return {
#             "predictions": results,
#             "count": len(results)
#         }
#     except Exception as e:
#         logger.error(f"Error in batch prediction: {str(e)}")
#         raise HTTPException(status_code=500, detail=str(e))

# @app.post("/predict/soil-image")
# async def predict_soil_image(file: UploadFile = File(...)):
#     try:
#         if not models_loaded:
#             raise HTTPException(status_code=503, detail="Models not loaded")

#         if not file.content_type.startswith('image/'):
#             raise HTTPException(status_code=400, detail="File must be an image")

#         image_data = await file.read()
#         processed_image = await image_processing.process_image(image_data)

#         return prediction_service.predict_from_soil_image(processed_image)
#     except HTTPException:
#         raise
#     except Exception as e:
#         logger.error(f"Error in soil image prediction: {str(e)}")
#         raise HTTPException(status_code=500, detail=str(e))

# @app.post("/predict/region")#Only for Weather Data not for Crop Recommendation
# async def predict_region(region_data: dict):
#     region = region_data.get('region')
#     lat = region_data.get('lat')
#     lon = region_data.get('lon')
#     try:
#         if not models_loaded:
#             raise HTTPException(status_code=503, detail="Models not loaded")

#         if lat and lon:
#             weather_data = weather_service.get_weather_by_coords(lat, lon)
#             region_name = weather_service.get_region_from_coords(lat, lon)
#         else:
#             weather_data = weather_service.get_weather_by_region(region)
#             region_name = region

#         return prediction_service.predict_from_region(region_name, weather_data)
#     except HTTPException:
#         raise
#     except Exception as e:
#         logger.error(f"Error in region prediction: {str(e)}")
#         raise HTTPException(status_code=500, detail=str(e))

# @app.get("/soil-types")
# async def get_soil_types():
#     return {
#         "soil_types": SOIL_TYPES,
#         "count": len(SOIL_TYPES)
#     }

# @app.get("/crop-categories")
# async def get_crop_categories():
#     return {
#         "categories": CROP_CATEGORIES,
#         "count": len(CROP_CATEGORIES)
#     }

# # ------------------- ERROR HANDLERS -------------------

# @app.exception_handler(HTTPException)
# async def http_exception_handler(request, exc):
#     return JSONResponse(
#         status_code=exc.status_code,
#         content=format_error(exc.detail, exc.status_code)
#     )

# @app.exception_handler(Exception)
# async def general_exception_handler(request, exc):
#     logger.error(f"Unhandled exception: {str(exc)}")
#     return JSONResponse(
#         status_code=500,
#         content=format_error("Internal server error", 500)
#     )

# # ------------------- ENTRY POINT -------------------

# if __name__ == "__main__":
#     import uvicorn
#     uvicorn.run(
#         app,
#         host="0.0.0.0",
#         port=8000,
#         log_level="info",
#         reload=True
#     )

from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import logging
from typing import List
from datetime import datetime
from contextlib import asynccontextmanager
from typing import Union

# Import local modules
from schemas.soil_params import SoilParams
from schemas.recommendation import RecommendationResponse
from services.prediction_service import PredictionService
from services.weather_service import WeatherService
from services.image_processing import ImageProcessingService
from utils.helpers import format_error
from utils.constants import SOIL_TYPES, CROP_CATEGORIES

# Import the CropRecommender
from services.crop_recommender import CropRecommender

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

import os
logger.info(f"Current working directory: {os.getcwd()}")

# Initialize services
prediction_service = PredictionService()
weather_service = WeatherService()
image_processing = ImageProcessingService()

# Initialize Crop Recommender
crop_recommender = CropRecommender()

# Global flag for models
models_loaded = False

# Lifespan for loading models at startup
# @asynccontextmanager
# async def lifespan(app: FastAPI):
#     global models_loaded
#     try:
#         logger.info("Loading ML models from PredictionService...")
#         prediction_service.load_models()  # Synchronous load
        
#         logger.info("Loading Crop Recommendation model...")
#         crop_recommender.load_model('ml-backend/saved_models/crop_recommender_model.joblib')
        
#         models_loaded = True
#         logger.info("✅ All ML models loaded successfully")
#     except Exception as e:
#         logger.error(f"❌ Error loading models: {str(e)}")
#         models_loaded = False
#     yield
#     # Optional: Cleanup on shutdown
#     logger.info("Shutting down application...")

# Update the lifespan function in main.py
@asynccontextmanager
async def lifespan(app: FastAPI):
    global models_loaded
    try:
        logger.info("Loading ML models from PredictionService...")
        prediction_service.load_models()  # Synchronous load
        
        logger.info("Loading Crop Recommendation model...")
        try:
            crop_recommender.load_model('ml-backend/saved_models/crop_recommender_model.joblib')
            models_loaded = True
            logger.info("✅ All ML models loaded successfully")
        except FileNotFoundError:
            logger.warning("Crop recommendation model not found. Region-based recommendations will be disabled.")
            logger.info("To enable region recommendations, run: python train_model.py")
            models_loaded = True  # Still mark as loaded since other models are available
        
    except Exception as e:
        logger.error(f"❌ Error loading models: {str(e)}")
        models_loaded = False
    yield
    # Optional: Cleanup on shutdown
    logger.info("Shutting down application...")

# Initialize FastAPI app with lifespan
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
        "status": "operational" if models_loaded else "models_not_loaded",
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

@app.post("/predict/soil-params")
@app.post("/batch-predict/soil-params")
async def predict_soil_params(soil_params: Union[SoilParams, List[SoilParams]]):
    """
    Handles both single and batch predictions
    """
    try:
        if not models_loaded:
            raise HTTPException(status_code=503, detail="Models not loaded")
        
        # Check if it's a single object or list
        if isinstance(soil_params, list):
            # Batch prediction
            results = [
                prediction_service.predict_from_soil_params(params.dict())
                for params in soil_params
            ]
            return {
                "predictions": results,
                "count": len(results)
            }
        else:
            # Single prediction
            result = prediction_service.predict_from_soil_params(soil_params.dict())
            return result
            
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

        return {
            "predictions": results,
            "count": len(results)
        }
    except Exception as e:
        logger.error(f"Error in batch prediction: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/predict/soil-image", response_model=RecommendationResponse)
async def predict_soil_image(file: UploadFile = File(...)):  # This expects field name "file"
    try:
        if not models_loaded:
            raise HTTPException(status_code=503, detail="Models not loaded")
        
        # Validate file type
        if not file.content_type.startswith('image/'):
            raise HTTPException(status_code=400, detail="File must be an image")
        
        # Read and process image
        image_data = await file.read()
        
        # Validate file size (5MB limit)
        if len(image_data) > 5 * 1024 * 1024:
            raise HTTPException(status_code=413, detail="File size exceeds 5MB limit")
        
        processed_image = await image_processing.process_image(image_data)
        
        # Predict
        result = prediction_service.predict_from_soil_image(processed_image)
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in soil image prediction: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# Update the predict_region endpoint to handle missing model
@app.post("/predict/region")
async def predict_region(region_data: dict):
    """
    Get crop recommendations based on region name or coordinates
    """
    region = region_data.get('region')
    lat = region_data.get('lat')
    lng = region_data.get('lng')
    
    try:
        if not models_loaded:
            raise HTTPException(status_code=503, detail="Models not loaded")
        
        # Check if crop recommender is available
        if crop_recommender.crop_stats is None:
            raise HTTPException(
                status_code=503, 
                detail="Region recommendation model not available. Please train the model first."
            )

        # Get weather data if coordinates are provided
        weather_data = None
        if lat and lng:
            weather_data = weather_service.get_weather_by_coords(lat, lng)
        
        # Get crop recommendations
        if region:
            result = crop_recommender.get_recommendations_by_region(region)
        elif lat and lng:
            result = crop_recommender.get_recommendations_by_coordinates(lat, lng)
        else:
            raise HTTPException(status_code=400, detail="Either region or coordinates must be provided")
        
        # Add weather data to response if available
        if weather_data:
            result['weather_data'] = weather_data
            
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in region prediction: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/search/regions")
async def search_regions(query: str, limit: int = 10):
    """Search for states and districts matching a query"""
    try:
        if not models_loaded:
            raise HTTPException(status_code=503, detail="Models not loaded")
            
        results = crop_recommender.search_regions(query, limit)
        return {
            "query": query,
            "results": results,
            "count": len(results['states']) + len(results['districts'])
        }
    except Exception as e:
        logger.error(f"Error in region search: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/available/states")
async def get_available_states():
    """Get list of all available states in the dataset"""
    try:
        states = crop_recommender.get_available_states()
        return {
            "states": states,
            "count": len(states)
        }
    except Exception as e:
        logger.error(f"Error getting states: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/available/districts")
async def get_available_districts(state: str = None):
    """Get list of districts, optionally filtered by state"""
    try:
        districts = crop_recommender.get_available_districts(state)
        return {
            "districts": districts,
            "count": len(districts),
            "state": state if state else "all"
        }
    except Exception as e:
        logger.error(f"Error getting districts: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/soil-types")
async def get_soil_types():
    return {
        "soil_types": SOIL_TYPES,
        "count": len(SOIL_TYPES)
    }

@app.get("/crop-categories")
async def get_crop_categories():
    return {
        "categories": CROP_CATEGORIES,
        "count": len(CROP_CATEGORIES)
    }

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