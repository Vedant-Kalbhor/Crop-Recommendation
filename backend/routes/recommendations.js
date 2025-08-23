const express = require('express');
const axios = require('axios');
const auth = require('../middleware/auth');
const Recommendation = require('../models/Recommendation');

const router = express.Router();

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

// Soil image recommendation
router.post('/soil-image', auth, async (req, res) => {
  try {
    // This would typically involve file upload handling
    // For now, we'll assume the image is processed on the frontend
    // and we're just receiving the prediction result
    
    const { imageData, soilType } = req.body;
    
    // In a real implementation, you would:
    // 1. Upload image to cloud storage
    // 2. Send image URL to ML API
    // 3. Process the response
    
    // For demo purposes, we'll simulate this
    const response = await axios.post(`${ML_API_BASE}/predict/soil-image`, {
      image: imageData // This would be a file in real implementation
    }, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    
    // Save recommendation to database
    const recommendation = new Recommendation({
      userId: req.user.id,
      method: 'soil_image',
      inputData: { imageUrl: 'uploaded-image-url', soilType },
      recommendations: response.data.recommendations
    });
    
    await recommendation.save();
    
    res.json(recommendation);
  } catch (error) {
    console.error('Error getting soil image recommendation:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Region-based recommendation
router.post('/region', auth, async (req, res) => {
  try {
    const { region, lat, lng } = req.body;
    
    // Call ML API
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
        region,
        coordinates: lat && lng ? [lat, lng] : undefined,
        weatherData: response.data.weather_data
      },
      recommendations: response.data.recommendations
    });
    
    await recommendation.save();
    
    res.json(recommendation);
  } catch (error) {
    console.error('Error getting region-based recommendation:', error);
    res.status(500).json({ message: 'Server error' });
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