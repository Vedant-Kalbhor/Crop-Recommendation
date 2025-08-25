from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional

class RecommendationItem(BaseModel):
    crop: str = Field(..., description="Recommended crop name")
    confidence: float = Field(..., ge=0, le=1, description="Confidence score (0-1)")
    reason: str = Field(..., description="Reason for recommendation")
    
    class Config:
        schema_extra = {
            "example": {
                "crop": "Wheat",
                "confidence": 0.95,
                "reason": "Ideal soil and weather conditions"
            }
        }

class RecommendationResponse(BaseModel):
    recommendations: List[RecommendationItem] = Field(..., description="List of crop recommendations")
    method: str = Field(..., description="Prediction method used")
    input_data: Optional[Dict[str, Any]] = Field(None, description="Input data used for prediction")
    soil_type: Optional[str] = Field(None, description="Detected soil type (for image analysis)")
    region: Optional[str] = Field(None, description="Region used for prediction")
    weather_data: Optional[Dict[str, float]] = Field(None, description="Weather data used for prediction")
    
    class Config:
        schema_extra = {
            "example": {
                "recommendations": [
                    {
                        "crop": "Wheat",
                        "confidence": 0.95,
                        "reason": "Ideal soil and weather conditions"
                    }
                ],
                "method": "soil_params",
                "input_data": {
                    "N": 50.0,
                    "P": 40.0,
                    "K": 30.0,
                    "temperature": 25.0,
                    "humidity": 60.0,
                    "rainfall": 100.0,
                    "ph": 6.5
                }
            }
        }