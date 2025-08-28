from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class WeatherData(BaseModel):
    temperature: float = Field(..., description="Temperature in Celsius")
    humidity: float = Field(..., description="Humidity percentage")
    rainfall: float = Field(..., description="Rainfall in mm")
    description: Optional[str] = Field(None, description="Weather description")
    location: Optional[str] = Field(None, description="Location name")
    country: Optional[str] = Field(None, description="Country code")
    timestamp: Optional[datetime] = Field(None, description="Weather data timestamp")
    
    class Config:
        json_schema_extra = {
            "example": {
                "temperature": 25.0,
                "humidity": 60.0,
                "rainfall": 100.0,
                "description": "clear sky",
                "location": "New York",
                "country": "US",
                "timestamp": "2023-12-15T10:30:00Z"
            }
        }