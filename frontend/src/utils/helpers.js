// Format date to readable string
export const formatDate = (date) => {
    if (!date) return '';
    
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  // Format file size to human readable format
  export const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };
  
  // Validate email format
  export const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };
  
  // Validate password strength
  export const isStrongPassword = (password) => {
    // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
    const strongRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    return strongRegex.test(password);
  };
  
  // Debounce function for search inputs
  export const debounce = (func, wait) => {
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
  
  // Capitalize first letter of each word
  export const capitalizeWords = (str) => {
    if (!str) return '';
    return str.replace(/\b\w/g, char => char.toUpperCase());
  };
  
  // Truncate text with ellipsis
  export const truncateText = (text, maxLength = 50) => {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    
    return text.substring(0, maxLength) + '...';
  };
  
  // Get color based on status
  export const getStatusColor = (status) => {
    switch (status) {
      case 'success':
        return '#27ae60';
      case 'failure':
        return '#e74c3c';
      case 'pending':
        return '#f39c12';
      default:
        return '#95a5a6';
    }
  };
  
  // Format percentage
  export const formatPercentage = (value) => {
    return `${Math.round(value * 100)}%`;
  };
  
  // Validate soil parameters
  export const validateSoilParams = (params) => {
    const errors = {};
    
    if (!params.N || params.N < 0 || params.N > 140) {
      errors.N = 'Nitrogen must be between 0 and 140';
    }
    
    if (!params.P || params.P < 0 || params.P > 145) {
      errors.P = 'Phosphorus must be between 0 and 145';
    }
    
    if (!params.K || params.K < 0 || params.K > 205) {
      errors.K = 'Potassium must be between 0 and 205';
    }
    
    if (!params.temperature || params.temperature < 0 || params.temperature > 50) {
      errors.temperature = 'Temperature must be between 0 and 50°C';
    }
    
    if (!params.humidity || params.humidity < 0 || params.humidity > 100) {
      errors.humidity = 'Humidity must be between 0 and 100%';
    }
    
    if (!params.rainfall || params.rainfall < 0 || params.rainfall > 300) {
      errors.rainfall = 'Rainfall must be between 0 and 300mm';
    }
    
    if (!params.ph || params.ph < 0 || params.ph > 14) {
      errors.ph = 'pH must be between 0 and 14';
    }
    
    return errors;
  };
  
  // Get browser location
  export const getBrowserLocation = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by this browser'));
        return;
      }
      
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          reject(error);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
        }
      );
    });
  };
  
  // Download data as CSV
  export const downloadCSV = (data, filename) => {
    const csvContent = convertToCSV(data);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };
  
  // Convert data to CSV format
  const convertToCSV = (data) => {
    if (data.length === 0) return '';
    
    const headers = Object.keys(data[0]);
    const csvRows = [headers.join(',')];
    
    data.forEach(row => {
      const values = headers.map(header => {
        const value = row[header];
        return typeof value === 'string' && value.includes(',') 
          ? `"${value}"` 
          : value;
      });
      csvRows.push(values.join(','));
    });
    
    return csvRows.join('\n');
  };
  
  // Local storage utilities
  export const storage = {
    get: (key, defaultValue = null) => {
      try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : defaultValue;
      } catch (error) {
        console.error('Error getting from localStorage:', error);
        return defaultValue;
      }
    },
    
    set: (key, value) => {
      try {
        localStorage.setItem(key, JSON.stringify(value));
      } catch (error) {
        console.error('Error setting to localStorage:', error);
      }
    },
    
    remove: (key) => {
      try {
        localStorage.removeItem(key);
      } catch (error) {
        console.error('Error removing from localStorage:', error);
      }
    },
    
    clear: () => {
      try {
        localStorage.clear();
      } catch (error) {
        console.error('Error clearing localStorage:', error);
      }
    }
  };
  
  // Generate random ID
  export const generateId = () => {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  };
  
  // Sleep function for testing
  export const sleep = (ms) => {
    return new Promise(resolve => setTimeout(resolve, ms));
  };