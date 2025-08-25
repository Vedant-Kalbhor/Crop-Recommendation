// Format response data
const formatResponse = (data, message = 'Success', status = 200) => {
    return {
      status,
      message,
      data,
      timestamp: new Date().toISOString()
    };
  };
  
  // Format error response
  const formatError = (message, status = 500, details = null) => {
    return {
      status,
      message,
      details,
      timestamp: new Date().toISOString()
    };
  };
  
  // Validate email format
  const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };
  
  // Validate password strength
  const isStrongPassword = (password) => {
    // At least 8 characters, 1 uppercase, 1 lowercase, 1 number, 1 special character
    const strongRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return strongRegex.test(password);
  };
  
  // Generate random string
  const generateRandomString = (length = 12) => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    
    for (let i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    
    return result;
  };
  
  // Format file size
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
  
  // Calculate distance between two coordinates (Haversine formula)
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    
    return distance; // in kilometers
  };
  
  // Debounce function
  const debounce = (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  };
  
  // Throttle function
  const throttle = (func, limit) => {
    let inThrottle;
    return function(...args) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  };
  
  // Parse query parameters
  const parseQueryParams = (queryString) => {
    const params = {};
    const query = queryString.substring(1);
    const pairs = query.split('&');
    
    for (const pair of pairs) {
      const [key, value] = pair.split('=');
      if (key && value) {
        params[decodeURIComponent(key)] = decodeURIComponent(value);
      }
    }
    
    return params;
  };
  
  // Deep clone object
  const deepClone = (obj) => {
    if (obj === null || typeof obj !== 'object') return obj;
    if (obj instanceof Date) return new Date(obj.getTime());
    if (obj instanceof Array) return obj.map(item => deepClone(item));
    
    const cloned = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        cloned[key] = deepClone(obj[key]);
      }
    }
    
    return cloned;
  };
  
  // Merge objects deeply
  const deepMerge = (target, source) => {
    if (typeof target !== 'object' || target === null) {
      return source;
    }
    
    if (typeof source !== 'object' || source === null) {
      return target;
    }
    
    const merged = Array.isArray(target) ? [...target] : { ...target };
    
    for (const key in source) {
      if (source.hasOwnProperty(key)) {
        if (typeof source[key] === 'object' && source[key] !== null) {
          if (typeof merged[key] === 'object' && merged[key] !== null) {
            merged[key] = deepMerge(merged[key], source[key]);
          } else {
            merged[key] = deepClone(source[key]);
          }
        } else {
          merged[key] = source[key];
        }
      }
    }
    
    return merged;
  };
  
  module.exports = {
    formatResponse,
    formatError,
    isValidEmail,
    isStrongPassword,
    generateRandomString,
    formatFileSize,
    sanitizeInput,
    calculateDistance,
    debounce,
    throttle,
    parseQueryParams,
    deepClone,
    deepMerge
  };