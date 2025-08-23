const validateRegisterInput = (username, email, password) => {
    const errors = {};
    
    if (!username || username.trim() === '') {
      errors.username = 'Username is required';
    }
    
    if (!email || email.trim() === '') {
      errors.email = 'Email is required';
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        errors.email = 'Email is invalid';
      }
    }
    
    if (!password || password === '') {
      errors.password = 'Password is required';
    } else if (password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }
    
    return {
      errors,
      valid: Object.keys(errors).length === 0
    };
  };
  
  const validateLoginInput = (email, password) => {
    const errors = {};
    
    if (!email || email.trim() === '') {
      errors.email = 'Email is required';
    }
    
    if (!password || password === '') {
      errors.password = 'Password is required';
    }
    
    return {
      errors,
      valid: Object.keys(errors).length === 0
    };
  };
  
  module.exports = {
    validateRegisterInput,
    validateLoginInput
  };