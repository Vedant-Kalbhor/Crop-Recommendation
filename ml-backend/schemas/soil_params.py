from pydantic import BaseModel, Field, validator
from typing import Optional

class SoilParams(BaseModel):
    N: float = Field(..., ge=0, le=140, description="Nitrogen content in mg/kg")
    P: float = Field(..., ge=0, le=145, description="Phosphorus content in mg/kg")
    K: float = Field(..., ge=0, le=205, description="Potassium content in mg/kg")
    temperature: float = Field(..., ge=0, le=50, description="Temperature in Celsius")
    humidity: float = Field(..., ge=0, le=100, description="Humidity percentage")
    rainfall: float = Field(..., ge=0, le=300, description="Rainfall in mm")
    ph: float = Field(..., ge=0, le=14, description="pH value")
    
    @validator('*', pre=True)
    def validate_numeric_fields(cls, v):
        if v is None:
            return v
        try:
            return float(v)
        except (TypeError, ValueError):
            raise ValueError('All soil parameters must be numeric')
    
    class Config:
        schema_extra = {
            "example": {
                "N": 50.0,
                "P": 40.0,
                "K": 30.0,
                "temperature": 25.0,
                "humidity": 60.0,
                "rainfall": 100.0,
                "ph": 6.5
            }
        }