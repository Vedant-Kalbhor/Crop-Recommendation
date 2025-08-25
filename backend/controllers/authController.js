const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { validateRegisterInput, validateLoginInput } = require('../middleware/validation');

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  });
};

// Register user
const register = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    
    // Validate input
    const { errors, valid } = validateRegisterInput(username, email, password);
    if (!valid) {
      return res.status(400).json({ errors });
    }
    
    // Check if user exists
    const userExists = await User.findOne({ 
      $or: [{ email }, { username }] 
    });
    
    if (userExists) {
      return res.status(400).json({ 
        message: 'User already exists with this email or username' 
      });
    }
    
    // Create user
    const user = await User.create({
      username,
      email,
      password
    });
    
    if (user) {
      const token = generateToken(user._id);
      
      res.status(201).json({
        _id: user._id,
        username: user.username,
        email: user.email,
        token
      });
    }
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Login user
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Validate input
    const { errors, valid } = validateLoginInput(email, password);
    if (!valid) {
      return res.status(400).json({ errors });
    }
    
    // Check for user
    const user = await User.findOne({ email }).select('+password');
    
    if (user && (await user.correctPassword(password, user.password))) {
      const token = generateToken(user._id);
      
      res.json({
        _id: user._id,
        username: user.username,
        email: user.email,
        token
      });
    } else {
      res.status(401).json({ message: 'Invalid credentials' });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get current user
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    res.json(user);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update user profile
const updateProfile = async (req, res) => {
  try {
    const { region, lat, lng } = req.body;
    const user = await User.findById(req.user.id);
    
    if (user) {
      if (region) user.region = region;
      if (lat && lng) {
        user.location = {
          type: 'Point',
          coordinates: [parseFloat(lng), parseFloat(lat)]
        };
      }
      
      const updatedUser = await user.save();
      
      res.json({
        _id: updatedUser._id,
        username: updatedUser.username,
        email: updatedUser.email,
        region: updatedUser.region,
        location: updatedUser.location
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  register,
  login,
  getMe,
  updateProfile
};