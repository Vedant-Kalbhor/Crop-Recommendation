from typing import Any, Dict, Optional
from datetime import datetime

def format_response(data: Any, message: str = "Success", status: int = 200) -> Dict[str, Any]:
    """Format successful API response"""
    return {
        "status": status,
        "message": message,
        "data": data,
        "timestamp": datetime.now().isoformat()
    }

def format_error(message: str, status: int = 500, details: Optional[str] = None) -> Dict[str, Any]:
    """Format error response"""
    response = {
        "status": status,
        "message": message,
        "timestamp": datetime.now().isoformat()
    }
    
    if details:
        response["details"] = details
    
    return response

def validate_soil_params(params: Dict[str, float]) -> bool:
    """Validate soil parameter ranges"""
    ranges = {
        'N': (0, 140),
        'P': (0, 145),
        'K': (0, 205),
        'temperature': (0, 50),
        'humidity': (0, 100),
        'rainfall': (0, 300),
        'ph': (0, 14)
    }
    
    for key, value in params.items():
        if key in ranges:
            min_val, max_val = ranges[key]
            if not (min_val <= value <= max_val):
                return False
    
    return True

def calculate_confidence_score(probabilities: list) -> float:
    """Calculate confidence score from probabilities"""
    if not probabilities:
        return 0.0
    return max(probabilities)

def normalize_confidence(confidence: float) -> float:
    """Normalize confidence score to 0-1 range"""
    return max(0.0, min(1.0, confidence))

def get_soil_type_description(soil_type: str) -> str:
    """Get description for soil type"""
    descriptions = {
        'clay': 'Heavy soil that retains water well, rich in nutrients',
        'sandy': 'Light soil that drains quickly, warms up fast in spring',
        'loamy': 'Ideal soil with good drainage and moisture retention',
        'silty': 'Smooth soil that retains moisture, fertile but can compact',
        'peaty': 'Acidic soil that retains moisture, rich in organic matter',
        'chalky': 'Alkaline soil that is free-draining, low in nutrients'
    }
    return descriptions.get(soil_type, 'Unknown soil type')