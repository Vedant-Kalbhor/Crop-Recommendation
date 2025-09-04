const express = require('express');
const axios = require('axios');
const auth = require('../middleware/auth');
const Recommendation = require('../models/Recommendation');
const multer = require('multer');
const FormData = require('form-data');

const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({ storage });


// ML API base URL
const ML_API_BASE = process.env.ML_API_URL || 'http://localhost:8000';

// Get recommendation history for user
router.get('/history', auth, async (req, res) => {
  try {
    const recommendations = await Recommendation.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .limit(20);
    
    res.json(recommendations);
  } catch (error) {
    console.error('Error fetching recommendation history:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Soil parameters recommendation
router.post('/soil-params', auth, async (req, res) => {
  try {
    const { N, P, K, temperature, humidity, rainfall, ph } = req.body;
    
    // Call ML API
    const response = await axios.post(`${ML_API_BASE}/predict/soil-params`, {
      N, P, K, temperature, humidity, rainfall, ph
    });
    
    // Save recommendation to database
    const recommendation = new Recommendation({
      userId: req.user.id,
      method: 'soil_params',
      inputData: { N, P, K, temperature, humidity, rainfall, ph },
      recommendations: response.data.recommendations
    });
    
    await recommendation.save();
    
    res.json(recommendation);
  } catch (error) {
    console.error('Error getting soil parameters recommendation:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Soil image recommendation route
router.post('/soil-image', auth, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        message: 'No image file uploaded',
        recommendations: [] // Always include recommendations array
      });
    }
    
    console.log('Received image file:', req.file.originalname);
    
    // Create FormData to forward to ML API
    const formData = new FormData();
    formData.append('file', req.file.buffer, {
      filename: req.file.originalname,
      contentType: req.file.mimetype
    });
    
    console.log('Forwarding to ML API...');
    
    // Call ML API
    const response = await axios.post(`${ML_API_BASE}/predict/soil-image`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        ...formData.getHeaders()
      },
      timeout: 30000 // 30 second timeout
    });
    
    console.log('ML API response:', response.data);
    
    // Ensure proper response structure
    const safeResponse = {
      recommendations: Array.isArray(response.data.recommendations) 
        ? response.data.recommendations 
        : [],
      soil_type: response.data.soil_type || 'unknown',
      method: response.data.method || 'soil_image',
      // Include any other fields that might be useful
      ...response.data
    };
    
    // Save recommendation to database
    const recommendation = new Recommendation({
      userId: req.user.id,
      method: 'soil_image',
      inputData: { 
        imageUrl: `uploaded-${Date.now()}-${req.file.originalname}`,
        soil_type: safeResponse.soil_type
      },
      recommendations: safeResponse.recommendations
    });
    
    await recommendation.save();
    
    // Send response to client
    res.json(safeResponse);
    
  } catch (error) {
    console.error('Error in soil image recommendation:', error.message);
    console.error('Error details:', error.response?.data || error.stack);
    
    // Send proper error response with expected structure
    res.status(500).json({ 
      message: 'Error analyzing soil image',
      error: error.message,
      recommendations: [], // Always include recommendations array
      soil_type: 'unknown'
    });
  }
});


// Region-based recommendation
router.post('/region', auth, async (req, res) => {
  try {
    const { region, lat, lng } = req.body;
    
    // Validate input
    if (!region && (!lat || !lng)) {
      return res.status(400).json({ message: 'Either region or coordinates are required' });
    }
    
    // Call ML API with JSON body
    const response = await axios.post(`${ML_API_BASE}/predict/region`, {
      region,
      lat,
      lon: lng
    });
    
    // Save recommendation to database
    const recommendation = new Recommendation({
      userId: req.user.id,
      method: 'region',
      inputData: {
        region: response.data.region || region,
        coordinates: lat && lng ? [lat, lng] : undefined,
        weatherData: response.data.weather_data
      },
      recommendations: response.data.recommendations
    });
    
    await recommendation.save();
    
    res.json(recommendation);
  } catch (error) {
    console.error('Error getting region-based recommendation:', error.response?.data || error.message);
    
    // Provide better error messages
    if (error.response?.status === 400) {
      res.status(400).json({ message: error.response.data.detail || 'Invalid input' });
    } else if (error.response?.status === 500) {
      res.status(500).json({ message: 'ML service error: ' + (error.response.data.detail || 'Internal error') });
    } else if (error.code === 'ECONNREFUSED') {
      res.status(503).json({ message: 'ML service unavailable' });
    } else {
      res.status(500).json({ message: 'Server error' });
    }
  }
});


// Update recommendation success status
router.put('/:id/feedback', auth, async (req, res) => {
  try {
    const { successStatus, feedback } = req.body;
    
    const recommendation = await Recommendation.findOne({
      _id: req.params.id,
      userId: req.user.id
    });
    
    if (!recommendation) {
      return res.status(404).json({ message: 'Recommendation not found' });
    }
    
    recommendation.successStatus = successStatus;
    recommendation.feedback = feedback;
    
    await recommendation.save();
    
    res.json(recommendation);
  } catch (error) {
    console.error('Error updating recommendation feedback:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;