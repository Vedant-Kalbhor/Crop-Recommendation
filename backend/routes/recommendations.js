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


// routes/recommendations.js — replace the /region POST handler with this version

// Region-based recommendation
router.post('/region', auth, async (req, res) => {
  try {
    const { region, lat, lng, lon, district } = req.body;

    // Validate input: require either region (state) or coordinates
    if (!region && !(lat && (lng || lon))) {
      return res.status(400).json({ message: 'Either region (state) or coordinates are required' });
    }

    // Build payload for ML API. Prefer lat & lng; send lon too for compatibility
    let payload = {};
    if (lat && (lng || lon)) {
      payload = { lat, lng: lng || lon, lon: lng || lon };
    } else {
      payload = { region };
      if (district) payload.district = district;
    }

    // Call ML API
    const response = await axios.post(`${ML_API_BASE}/predict/region`, payload);

    // The ML API returns recommendations (or an error field)
    const mlData = response.data || {};

    // Save the recommendation to DB (store state/district separately for analytics)
    const recommendation = new Recommendation({
      userId: req.user.id,
      method: 'region',
      inputData: {
        region: mlData.region || region,
        state: mlData.region || region,
        district: mlData.district || district,
        coordinates: lat && (lng || lon) ? [parseFloat(lat), parseFloat(lng || lon)] : undefined,
        weatherData: mlData.weather_data || {}
      },
      recommendations: mlData.recommendations || []
    });

    await recommendation.save();

    // return the ML response to client
    return res.json(mlData);

  } catch (error) {
    console.error('Error getting region-based recommendation:', error.response?.data || error.message || error);
    if (error.response?.status === 400) {
      return res.status(400).json({ message: error.response.data.detail || error.response.data || 'Invalid input' });
    } else if (error.code === 'ECONNREFUSED') {
      return res.status(503).json({ message: 'ML service unavailable' });
    } else {
      return res.status(500).json({ message: 'Server error' });
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