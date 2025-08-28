from typing import Dict, Any, Tuple
import numpy as np
from PIL import Image
import io

def validate_soil_parameters(params: Dict[str, Any]) -> Tuple[bool, str]:
    """Validate soil parameters"""
    required_fields = ['N', 'P', 'K', 'temperature', 'humidity', 'rainfall', 'ph']
    
    for field in required_fields:
        if field not in params:
            return False, f"Missing field: {field}"
        
        try:
            value = float(params[field])
        except (ValueError, TypeError):
            return False, f"Invalid value for {field}: must be numeric"
    
    # Check value ranges
    ranges = {
        'N': (0, 140), 'P': (0, 145), 'K': (0, 205),
        'temperature': (0, 50), 'humidity': (0, 100),
        'rainfall': (0, 300), 'ph': (0, 14)
    }
    
    for field, (min_val, max_val) in ranges.items():
        value = float(params[field])
        if not (min_val <= value <= max_val):
            return False, f"{field} must be between {min_val} and {max_val}"
    
    return True, "Valid"

def validate_image_file(image_data: bytes, max_size: int = 5 * 1024 * 1024) -> Tuple[bool, str]:
    """Validate uploaded image file"""
    if len(image_data) > max_size:
        return False, f"File size exceeds maximum allowed size of {max_size} bytes"
    
    try:
        image = Image.open(io.BytesIO(image_data))
        if image.format not in ['JPEG', 'PNG', 'JPG']:
            return False, "Only JPEG and PNG images are supported"
        
        return True, "Valid"
    except Exception as e:
        return False, f"Invalid image file: {str(e)}"

def validate_coordinates(lat: float, lon: float) -> Tuple[bool, str]:
    """Validate geographic coordinates"""
    if not (-90 <= lat <= 90):
        return False, "Latitude must be between -90 and 90"
    
    if not (-180 <= lon <= 180):
        return False, "Longitude must be between -180 and 180"
    
    return True, "Valid"

def validate_region_name(region: str) -> Tuple[bool, str]:
    """Validate region name"""
    if not region or not isinstance(region, str):
        return False, "Region name must be a non-empty string"
    
    if len(region) > 100:
        return False, "Region name too long"
    
    return True, "Valid"