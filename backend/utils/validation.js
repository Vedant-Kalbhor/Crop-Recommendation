const { VALIDATION_PATTERNS, SOIL_PARAM_RANGES } = require('./constants');

// Validate user registration data
const validateRegistration = (userData) => {
  const errors = {};

  if (!userData.username || userData.username.trim() === '') {
    errors.username = 'Username is required';
  } else if (!VALIDATION_PATTERNS.USERNAME.test(userData.username)) {
    errors.username = 'Username must be 3-30 characters and can only contain letters, numbers, and underscores';
  }

  if (!userData.email || userData.email.trim() === '') {
    errors.email = 'Email is required';
  } else if (!VALIDATION_PATTERNS.EMAIL.test(userData.email)) {
    errors.email = 'Please enter a valid email address';
  }

  if (!userData.password || userData.password === '') {
    errors.password = 'Password is required';
  } else if (userData.password.length < 6) {
    errors.password = 'Password must be at least 6 characters long';
  } else if (!VALIDATION_PATTERNS.PASSWORD.test(userData.password)) {
    errors.password = 'Password must contain at least one uppercase letter, one lowercase letter, and one number';
  }

  return {
    errors,
    isValid: Object.keys(errors).length === 0
  };
};

// Validate user login data
const validateLogin = (credentials) => {
  const errors = {};

  if (!credentials.email || credentials.email.trim() === '') {
    errors.email = 'Email is required';
  } else if (!VALIDATION_PATTERNS.EMAIL.test(credentials.email)) {
    errors.email = 'Please enter a valid email address';
  }

  if (!credentials.password || credentials.password === '') {
    errors.password = 'Password is required';
  }

  return {
    errors,
    isValid: Object.keys(errors).length === 0
  };
};

// Validate soil parameters
const validateSoilParams = (params) => {
  const errors = {};

  if (params.N === undefined || params.N === null || params.N === '') {
    errors.N = 'Nitrogen (N) is required';
  } else if (isNaN(params.N) || params.N < SOIL_PARAM_RANGES.N.min || params.N > SOIL_PARAM_RANGES.N.max) {
    errors.N = `Nitrogen must be a number between ${SOIL_PARAM_RANGES.N.min} and ${SOIL_PARAM_RANGES.N.max}`;
  }

  if (params.P === undefined || params.P === null || params.P === '') {
    errors.P = 'Phosphorus (P) is required';
  } else if (isNaN(params.P) || params.P < SOIL_PARAM_RANGES.P.min || params.P > SOIL_PARAM_RANGES.P.max) {
    errors.P = `Phosphorus must be a number between ${SOIL_PARAM_RANGES.P.min} and ${SOIL_PARAM_RANGES.P.max}`;
  }

  if (params.K === undefined || params.K === null || params.K === '') {
    errors.K = 'Potassium (K) is required';
  } else if (isNaN(params.K) || params.K < SOIL_PARAM_RANGES.K.min || params.K > SOIL_PARAM_RANGES.K.max) {
    errors.K = `Potassium must be a number between ${SOIL_PARAM_RANGES.K.min} and ${SOIL_PARAM_RANGES.K.max}`;
  }

  if (params.temperature === undefined || params.temperature === null || params.temperature === '') {
    errors.temperature = 'Temperature is required';
  } else if (isNaN(params.temperature) || params.temperature < SOIL_PARAM_RANGES.TEMPERATURE.min || params.temperature > SOIL_PARAM_RANGES.TEMPERATURE.max) {
    errors.temperature = `Temperature must be a number between ${SOIL_PARAM_RANGES.TEMPERATURE.min} and ${SOIL_PARAM_RANGES.TEMPERATURE.max}`;
  }

  if (params.humidity === undefined || params.humidity === null || params.humidity === '') {
    errors.humidity = 'Humidity is required';
  } else if (isNaN(params.humidity) || params.humidity < SOIL_PARAM_RANGES.HUMIDITY.min || params.humidity > SOIL_PARAM_RANGES.HUMIDITY.max) {
    errors.humidity = `Humidity must be a number between ${SOIL_PARAM_RANGES.HUMIDITY.min} and ${SOIL_PARAM_RANGES.HUMIDITY.max}`;
  }

  if (params.rainfall === undefined || params.rainfall === null || params.rainfall === '') {
    errors.rainfall = 'Rainfall is required';
  } else if (isNaN(params.rainfall) || params.rainfall < SOIL_PARAM_RANGES.RAINFALL.min || params.rainfall > SOIL_PARAM_RANGES.RAINFALL.max) {
    errors.rainfall = `Rainfall must be a number between ${SOIL_PARAM_RANGES.RAINFALL.min} and ${SOIL_PARAM_RANGES.RAINFALL.max}`;
  }

  if (params.ph === undefined || params.ph === null || params.ph === '') {
    errors.ph = 'pH value is required';
  } else if (isNaN(params.ph) || params.ph < SOIL_PARAM_RANGES.PH.min || params.ph > SOIL_PARAM_RANGES.PH.max) {
    errors.ph = `pH must be a number between ${SOIL_PARAM_RANGES.PH.min} and ${SOIL_PARAM_RANGES.PH.max}`;
  }

  return {
    errors,
    isValid: Object.keys(errors).length === 0
  };
};

// Validate region data
const validateRegionData = (data) => {
  const errors = {};

  if (!data.region && (!data.lat || !data.lng)) {
    errors.general = 'Either region name or coordinates are required';
  }

  if (data.region && typeof data.region !== 'string') {
    errors.region = 'Region must be a string';
  }

  if (data.lat && (isNaN(data.lat) || data.lat < -90 || data.lat > 90)) {
    errors.lat = 'Latitude must be a number between -90 and 90';
  }

  if (data.lng && (isNaN(data.lng) || data.lng < -180 || data.lng > 180)) {
    errors.lng = 'Longitude must be a number between -180 and 180';
  }

  return {
    errors,
    isValid: Object.keys(errors).length === 0
  };
};

// Validate file upload
const validateFileUpload = (file, options = {}) => {
  const {
    maxSize = 5 * 1024 * 1024, // 5MB default
    allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'],
    maxFiles = 1
  } = options;

  const errors = {};

  if (!file) {
    errors.file = 'File is required';
    return { errors, isValid: false };
  }

  if (Array.isArray(file)) {
    if (file.length > maxFiles) {
      errors.file = `Maximum ${maxFiles} files allowed`;
    }
    
    file.forEach((f, index) => {
      if (f.size > maxSize) {
        errors[`file_${index}`] = `File ${f.name} exceeds maximum size of ${formatFileSize(maxSize)}`;
      }
      if (!allowedTypes.includes(f.mimetype)) {
        errors[`file_${index}_type`] = `File ${f.name} must be one of: ${allowedTypes.join(', ')}`;
      }
    });
  } else {
    if (file.size > maxSize) {
      errors.file = `File exceeds maximum size of ${formatFileSize(maxSize)}`;
    }
    
    if (!allowedTypes.includes(file.mimetype)) {
      errors.file_type = `File must be one of: ${allowedTypes.join(', ')}`;
    }
  }

  return {
    errors,
    isValid: Object.keys(errors).length === 0
  };
};

// Validate feedback data
const validateFeedback = (data) => {
  const errors = {};

  if (!data.successStatus || !['success', 'failure', 'pending'].includes(data.successStatus)) {
    errors.successStatus = 'Valid success status is required';
  }

  if (data.feedback && data.feedback.length > 1000) {
    errors.feedback = 'Feedback must be less than 1000 characters';
  }

  return {
    errors,
    isValid: Object.keys(errors).length === 0
  };
};

// Validate user profile update
const validateProfileUpdate = (data) => {
  const errors = {};

  if (data.username && !VALIDATION_PATTERNS.USERNAME.test(data.username)) {
    errors.username = 'Username must be 3-30 characters and can only contain letters, numbers, and underscores';
  }

  if (data.email && !VALIDATION_PATTERNS.EMAIL.test(data.email)) {
    errors.email = 'Please enter a valid email address';
  }

  if (data.region && typeof data.region !== 'string') {
    errors.region = 'Region must be a string';
  }

  if (data.lat && (isNaN(data.lat) || data.lat < -90 || data.lat > 90)) {
    errors.lat = 'Latitude must be a number between -90 and 90';
  }

  if (data.lng && (isNaN(data.lng) || data.lng < -180 || data.lng > 180)) {
    errors.lng = 'Longitude must be a number between -180 and 180';
  }

  return {
    errors,
    isValid: Object.keys(errors).length === 0
  };
};

// Helper function to format file size
const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Sanitize input data
const sanitizeInput = (data) => {
  if (typeof data === 'string') {
    return data.trim().replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  }
  
  if (Array.isArray(data)) {
    return data.map(item => sanitizeInput(item));
  }
  
  if (typeof data === 'object' && data !== null) {
    const sanitized = {};
    for (const key in data) {
      sanitized[key] = sanitizeInput(data[key]);
    }
    return sanitized;
  }
  
  return data;
};

// Validate pagination parameters
const validatePagination = (page, limit, maxLimit = 100) => {
  const errors = {};
  
  const pageNum = parseInt(page, 10);
  const limitNum = parseInt(limit, 10);
  
  if (isNaN(pageNum) || pageNum < 1) {
    errors.page = 'Page must be a positive integer';
  }
  
  if (isNaN(limitNum) || limitNum < 1 || limitNum > maxLimit) {
    errors.limit = `Limit must be between 1 and ${maxLimit}`;
  }
  
  return {
    errors,
    isValid: Object.keys(errors).length === 0,
    page: pageNum,
    limit: limitNum
  };
};

module.exports = {
  validateRegistration,
  validateLogin,
  validateSoilParams,
  validateRegionData,
  validateFileUpload,
  validateFeedback,
  validateProfileUpdate,
  validatePagination,
  sanitizeInput,
  formatFileSize
};