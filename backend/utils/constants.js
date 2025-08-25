// Application constants
module.exports = {
    // HTTP Status Codes
    HTTP_STATUS: {
      OK: 200,
      CREATED: 201,
      ACCEPTED: 202,
      NO_CONTENT: 204,
      BAD_REQUEST: 400,
      UNAUTHORIZED: 401,
      FORBIDDEN: 403,
      NOT_FOUND: 404,
      METHOD_NOT_ALLOWED: 405,
      CONFLICT: 409,
      UNPROCESSABLE_ENTITY: 422,
      TOO_MANY_REQUESTS: 429,
      INTERNAL_SERVER_ERROR: 500,
      SERVICE_UNAVAILABLE: 503
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
  
    // Soil types
    SOIL_TYPES: [
      'clay',
      'sandy',
      'loamy',
      'silty',
      'peaty',
      'chalky'
    ],
  
    // Crop categories
    CROP_CATEGORIES: {
      CEREALS: 'cereals',
      PULSES: 'pulses',
      VEGETABLES: 'vegetables',
      FRUITS: 'fruits',
      OILSEEDS: 'oilseeds',
      FIBER: 'fiber'
    },
  
    // Weather conditions
    WEATHER_CONDITIONS: {
      CLEAR: 'clear',
      CLOUDS: 'clouds',
      RAIN: 'rain',
      SNOW: 'snow',
      THUNDERSTORM: 'thunderstorm',
      DRIZZLE: 'drizzle',
      MIST: 'mist',
      FOG: 'fog'
    },
  
    // File upload constraints
    FILE_UPLOAD: {
      MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
      ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/jpg'],
      ALLOWED_DOC_TYPES: ['application/pdf', 'text/plain'],
      MAX_FILES: 5
    },
  
    // Pagination defaults
    PAGINATION: {
      DEFAULT_PAGE: 1,
      DEFAULT_LIMIT: 10,
      MAX_LIMIT: 100
    },
  
    // Validation patterns
    VALIDATION_PATTERNS: {
      USERNAME: /^[a-zA-Z0-9_]{3,30}$/,
      PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
      EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      PHONE: /^\+?[1-9]\d{1,14}$/,
      ZIP_CODE: /^\d{5}(-\d{4})?$/,
      COORDINATES: /^-?\d{1,3}(\.\d+)?$/
    },
  
    // API rate limiting
    RATE_LIMITING: {
      WINDOW_MS: 15 * 60 * 1000, // 15 minutes
      MAX_REQUESTS: 100 // limit each IP to 100 requests per windowMs
    },
  
    // Cache expiration times (in seconds)
    CACHE_EXPIRATION: {
      SHORT: 300, // 5 minutes
      MEDIUM: 1800, // 30 minutes
      LONG: 3600, // 1 hour
      VERY_LONG: 86400 // 24 hours
    },
  
    // Soil parameter ranges
    SOIL_PARAM_RANGES: {
      N: { min: 0, max: 140 },
      P: { min: 0, max: 145 },
      K: { min: 0, max: 205 },
      TEMPERATURE: { min: 0, max: 50 },
      HUMIDITY: { min: 0, max: 100 },
      RAINFALL: { min: 0, max: 300 },
      PH: { min: 0, max: 14 }
    },
  
    // Region data
    REGIONS: {
      NORTH: 'north',
      SOUTH: 'south',
      EAST: 'east',
      WEST: 'west',
      CENTRAL: 'central',
      NORTHEAST: 'northeast',
      NORTHWEST: 'northwest',
      SOUTHEAST: 'southeast',
      SOUTHWEST: 'southwest'
    },
  
    // Season types
    SEASONS: {
      SPRING: 'spring',
      SUMMER: 'summer',
      AUTUMN: 'autumn',
      WINTER: 'winter',
      MONSOON: 'monsoon'
    }
  };