import numpy as np
from PIL import Image, ImageOps
import io
from typing import Optional
import logging

logger = logging.getLogger(__name__)

class ImageProcessingService:
    def __init__(self, target_size: tuple = (224, 224)):
        self.target_size = target_size
    
    async def process_image(self, image_data: bytes) -> np.ndarray:
        """Process uploaded image for model prediction"""
        try:
            # Open image from bytes
            image = Image.open(io.BytesIO(image_data))
            
            # Convert to RGB if necessary
            if image.mode != 'RGB':
                image = image.convert('RGB')
            
            # Resize image
            image = image.resize(self.target_size)
            
            # Apply preprocessing
            image = self._preprocess_image(image)
            
            # Convert to numpy array
            image_array = np.array(image) / 255.0
            image_array = np.expand_dims(image_array, axis=0)
            
            return image_array
            
        except Exception as e:
            logger.error(f"Error processing image: {str(e)}")
            raise
    
    def _preprocess_image(self, image: Image.Image) -> Image.Image:
        """Apply preprocessing to the image"""
        # Normalize and enhance image
        image = ImageOps.exif_transpose(image)  # Handle EXIF orientation
        image = ImageOps.autocontrast(image)    # Enhance contrast
        return image
    
    def validate_image(self, image_data: bytes, max_size: int = 5 * 1024 * 1024) -> bool:
        """Validate image before processing"""
        if len(image_data) > max_size:
            return False
        
        try:
            image = Image.open(io.BytesIO(image_data))
            return image.format in ['JPEG', 'PNG', 'JPG']
        except:
            return False