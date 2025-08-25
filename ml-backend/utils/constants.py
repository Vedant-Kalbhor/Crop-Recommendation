# Soil types
SOIL_TYPES = ['clay', 'sandy', 'loamy', 'silty', 'peaty', 'chalky']

# Crop categories
CROP_CATEGORIES = {
    'cereals': 'Cereals (Wheat, Rice, Maize, etc.)',
    'pulses': 'Pulses (Beans, Lentils, Peas, etc.)',
    'vegetables': 'Vegetables (Tomato, Potato, Onion, etc.)',
    'fruits': 'Fruits (Apple, Banana, Orange, etc.)',
    'oilseeds': 'Oilseeds (Sunflower, Soybean, Groundnut, etc.)',
    'fiber': 'Fiber Crops (Cotton, Jute, etc.)',
    'plantation': 'Plantation Crops (Coffee, Tea, Rubber, etc.)'
}

# Soil parameter ranges
SOIL_PARAM_RANGES = {
    'N': {'min': 0, 'max': 140, 'unit': 'mg/kg'},
    'P': {'min': 0, 'max': 145, 'unit': 'mg/kg'},
    'K': {'min': 0, 'max': 205, 'unit': 'mg/kg'},
    'temperature': {'min': 0, 'max': 50, 'unit': '°C'},
    'humidity': {'min': 0, 'max': 100, 'unit': '%'},
    'rainfall': {'min': 0, 'max': 300, 'unit': 'mm'},
    'ph': {'min': 0, 'max': 14, 'unit': 'pH'}
}

# API constants
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB
ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/jpg']

# Model configuration
MODEL_CONFIG = {
    'image_size': (224, 224),
    'batch_size': 32,
    'epochs': 50,
    'learning_rate': 0.001
}

# Region mapping
REGION_MAPPING = {
    'north': ['punjab', 'haryana', 'himachal', 'uttarakhand', 'uttar pradesh'],
    'south': ['tamil nadu', 'kerala', 'karnataka', 'andhra', 'telangana'],
    'east': ['west bengal', 'bihar', 'jharkhand', 'odisha'],
    'west': ['maharashtra', 'gujarat', 'goa', 'rajasthan'],
    'central': ['madhya pradesh', 'chhattisgarh'],
    'northeast': ['assam', 'meghalaya', 'nagaland', 'manipur', 'mizoram']
}