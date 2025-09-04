import numpy as np
from PIL import Image
import io
import logging

logger = logging.getLogger(__name__)

class ImageProcessingService:
    def __init__(self, target_size: tuple = (224, 224)):
        self.target_size = target_size
    
    async def process_image(self, image_data: bytes) -> np.ndarray:
        """Process uploaded image for CNN prediction"""
        try:
            image = Image.open(io.BytesIO(image_data)).convert("RGB")
            image = image.resize(self.target_size)

            image_array = np.array(image).astype("float32") / 255.0
            image_array = np.expand_dims(image_array, axis=0)

            return image_array
        except Exception as e:
            logger.error(f"Error processing image: {str(e)}")
            raise

        """Process uploaded image for model prediction"""
        try:
            # Open image from bytes
            image = Image.open(io.BytesIO(image_data))
            print(f"Original image mode: {image.mode}, size: {image.size}")
            
            # Convert to RGB if necessary
            if image.mode != 'RGB':
                print(f"Converting image from {image.mode} to RGB")
                image = image.convert('RGB')
            
            # Resize image to target size
            image = image.resize(self.target_size)
            print(f"Resized image size: {image.size}")
            
            # Convert to numpy array and normalize
            image_array = np.array(image) / 255.0
            print(f"Image array shape: {image_array.shape}, range: [{image_array.min()}, {image_array.max()}]")
            
            # Add batch dimension
            image_array = np.expand_dims(image_array, axis=0)
            print(f"Final array shape with batch dimension: {image_array.shape}")
            
            return image_array
            
        except Exception as e:
            logger.error(f"Error processing image: {str(e)}")
            raise
    
    def validate_image(self, image_data: bytes, max_size: int = 5 * 1024 * 1024) -> bool:
        """Validate image before processing"""
        if len(image_data) > max_size:
            return False
        
        try:
            image = Image.open(io.BytesIO(image_data))
            return image.format in ['JPEG', 'PNG', 'JPG']
        except:
            return False