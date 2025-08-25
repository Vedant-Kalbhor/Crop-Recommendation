// Application constants
export const APP_CONSTANTS = {
    // API endpoints
    API_BASE_URL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
    ML_API_URL: process.env.REACT_APP_ML_API_URL || 'http://localhost:8000',
    
    // Routes
    ROUTES: {
      HOME: '/',
      LOGIN: '/login',
      REGISTER: '/register',
      SOIL_ANALYSIS: '/soil-analysis',
      IMAGE_ANALYSIS: '/image-analysis',
      REGION_ANALYSIS: '/region-analysis',
      DASHBOARD: '/dashboard'
    },
    
    // User roles
    USER_ROLES: {
      FARMER: 'farmer',
      ADMIN: 'admin',
      EXPERT: 'expert'
    },
    
    // Recommendation methods
    RECOMMENDATION_METHODS: {
      SOIL_PARAMS: 'soil_params',
      SOIL_IMAGE: 'soil_image',
      REGION: 'region'
    },
    
    // Success status
    SUCCESS_STATUS: {
      PENDING: 'pending',
      SUCCESS: 'success',
      FAILURE: 'failure'
    },
    
    // Soil parameter ranges
    SOIL_PARAM_RANGES: {
      N: { min: 0, max: 140, step: 1 },
      P: { min: 0, max: 145, step: 1 },
      K: { min: 0, max: 205, step: 1 },
      TEMPERATURE: { min: 0, max: 50, step: 0.1 },
      HUMIDITY: { min: 0, max: 100, step: 1 },
      RAINFALL: { min: 0, max: 300, step: 1 },
      PH: { min: 0, max: 14, step: 0.1 }
    },
    
    // File upload constraints
    FILE_UPLOAD: {
      MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
      ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/jpg'],
      MAX_FILES: 5
    },
    
    // Weather conditions
    WEATHER_CONDITIONS: {
      CLEAR: 'clear',
      CLOUDS: 'clouds',
      RAIN: 'rain',
      SNOW: 'snow',
      THUNDERSTORM: 'thunderstorm',
      DRIZZLE: 'drizzle'
    },
    
    // Chart colors
    CHART_COLORS: [
      '#3498db', '#2ecc71', '#e74c3c', '#f39c12', '#9b59b6',
      '#1abc9c', '#34495e', '#e67e22', '#95a5a6', '#d35400'
    ],
    
    // Soil types
    SOIL_TYPES: [
      'clay', 'sandy', 'loamy', 'silty', 'peaty', 'chalky'
    ],
    
    // Crop categories
    CROP_CATEGORIES: {
      CEREALS: 'cereals',
      PULSES: 'pulses',
      VEGETABLES: 'vegetables',
      FRUITS: 'fruits',
      OILSEEDS: 'oilseeds'
    },
    
    // Regions
    REGIONS: [
      'North', 'South', 'East', 'West', 'Central',
      'Northeast', 'Northwest', 'Southeast', 'Southwest'
    ],
    
    // Seasons
    SEASONS: {
      SPRING: 'spring',
      SUMMER: 'summer',
      AUTUMN: 'autumn',
      WINTER: 'winter',
      MONSOON: 'monsoon'
    }
  };
  
  // Local storage keys
  export const STORAGE_KEYS = {
    AUTH_TOKEN: 'auth_token',
    USER_DATA: 'user_data',
    RECENT_RECOMMENDATIONS: 'recent_recommendations',
    USER_PREFERENCES: 'user_preferences'
  };
  
  // Error messages
  export const ERROR_MESSAGES = {
    NETWORK_ERROR: 'Network error. Please check your connection.',
    SERVER_ERROR: 'Server error. Please try again later.',
    UNAUTHORIZED: 'You need to be logged in to access this resource.',
    FORBIDDEN: 'You do not have permission to access this resource.',
    NOT_FOUND: 'The requested resource was not found.',
    VALIDATION_ERROR: 'Please check your input and try again.',
    FILE_TOO_LARGE: 'File is too large. Maximum size is 5MB.',
    INVALID_FILE_TYPE: 'Invalid file type. Please upload an image.',
    LOCATION_ERROR: 'Unable to retrieve your location.',
    WEATHER_API_ERROR: 'Unable to fetch weather data.'
  };
  
  // Success messages
  export const SUCCESS_MESSAGES = {
    LOGIN_SUCCESS: 'Logged in successfully!',
    REGISTER_SUCCESS: 'Account created successfully!',
    RECOMMENDATION_SUCCESS: 'Recommendation generated successfully!',
    FEEDBACK_SUCCESS: 'Feedback submitted successfully!',
    PROFILE_UPDATE_SUCCESS: 'Profile updated successfully!',
    FILE_UPLOAD_SUCCESS: 'File uploaded successfully!'
  };
  
  // Validation patterns
  export const VALIDATION_PATTERNS = {
    EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    USERNAME: /^[a-zA-Z0-9_]{3,30}$/,
    PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/,
    PHONE: /^\+?[1-9]\d{1,14}$/,
    COORDINATES: /^-?\d{1,3}(\.\d+)?$/
  };