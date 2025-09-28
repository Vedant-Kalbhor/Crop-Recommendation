const express = require('express');
const axios = require('axios');
const auth = require('../middleware/auth');
const Recommendation = require('../models/Recommendation');
const multer = require('multer');
const FormData = require('form-data');

const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({ storage });


const ML_API_BASE = process.env.ML_API_URL || 'http://localhost:8000';


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


router.post('/soil-params', auth, async (req, res) => {
  try {
    const { N, P, K, temperature, humidity, rainfall, ph } = req.body;
    
    console.log('Received soil params:', { N, P, K, temperature, humidity, rainfall, ph });
    
    
    const response = await axios.post(`${ML_API_BASE}/predict/soil-params`, {
      N, P, K, temperature, humidity, rainfall, ph
    });
    
    console.log('ML API response:', response.data);
    
    
    const recommendation = new Recommendation({
      userId: req.user.id,
      method: 'soil_params',
      inputData: { 
        N: parseFloat(N) || 0,
        P: parseFloat(P) || 0, 
        K: parseFloat(K) || 0, 
        temperature: parseFloat(temperature) || 0, 
        humidity: parseFloat(humidity) || 0, 
        rainfall: parseFloat(rainfall) || 0, 
        ph: parseFloat(ph) || 0 
      },
      recommendations: response.data.recommendations || response.data.predictions || [],
      successStatus: 'pending'
    });
    
    await recommendation.save();
    console.log('Saved soil params recommendation to DB:', recommendation._id);
    
    res.json({
      ...response.data,
      savedRecommendationId: recommendation._id
    });
    
  } catch (error) {
    console.error('Error getting soil parameters recommendation:', error.response?.data || error.message);
    
    
    try {
      const recommendation = new Recommendation({
        userId: req.user.id,
        method: 'soil_params',
        inputData: { 
          N: parseFloat(req.body.N) || 0,
          P: parseFloat(req.body.P) || 0, 
          K: parseFloat(req.body.K) || 0, 
          temperature: parseFloat(req.body.temperature) || 0, 
          humidity: parseFloat(req.body.humidity) || 0, 
          rainfall: parseFloat(req.body.rainfall) || 0, 
          ph: parseFloat(req.body.ph) || 0 
        },
        recommendations: [],
        successStatus: 'failure'
      });
      
      await recommendation.save();
    } catch (dbError) {
      console.error('Failed to save failed recommendation:', dbError);
    }
    
    if (error.code === 'ECONNREFUSED') {
      return res.status(503).json({ message: 'ML service unavailable' });
    }
    res.status(500).json({ 
      message: 'Server error',
      error: error.response?.data || error.message 
    });
  }
});

// Soil image recommendation route - ALREADY WORKING
router.post('/soil-image', auth, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        message: 'No image file uploaded',
        recommendations: []
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
      timeout: 30000
    });
    
    console.log('ML API response:', response.data);
    
    // Ensure proper response structure
    const safeResponse = {
      recommendations: Array.isArray(response.data.recommendations) 
        ? response.data.recommendations 
        : [],
      soil_type: response.data.soil_type || 'unknown',
      method: response.data.method || 'soil_image',
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
      recommendations: safeResponse.recommendations,
      successStatus: 'pending'
    });
    
    await recommendation.save();
    console.log('Saved soil image recommendation to DB:', recommendation._id);
    
    // Send response to client
    res.json(safeResponse);
    
  } catch (error) {
    console.error('Error in soil image recommendation:', error.message);
    console.error('Error details:', error.response?.data || error.stack);
    
    // Send proper error response with expected structure
    res.status(500).json({ 
      message: 'Error analyzing soil image',
      error: error.message,
      recommendations: [],
      soil_type: 'unknown'
    });
  }
});


router.post('/region', auth, async (req, res) => {
  try {
    const { region, district } = req.body;

    console.log('Received region analysis request:', { region, district });

    if (!region) {
      return res.status(400).json({ message: 'Region (state) is required' });
    }

    // Build payload for ML API
    const payload = { region };
    if (district) payload.district = district;

    // Call ML API
    const response = await axios.post(`${ML_API_BASE}/predict/region`, payload);
    const mlData = response.data || {};

    console.log('ML API region response:', mlData);

    // Save the recommendation to DB
    const recommendation = new Recommendation({
      userId: req.user.id,
      method: 'region',
      inputData: {
        region: mlData.region || region,
        district: mlData.district || district,
        state: mlData.region || region
      },
      recommendations: mlData.recommendations || [],
      successStatus: 'pending'
    });

    await recommendation.save();
    console.log('Saved region recommendation to DB:', recommendation._id);

    // Return the ML response to client
    return res.json(mlData);

  } catch (error) {
    console.error('Error getting region-based recommendation:', error.response?.data || error.message || error);
    
    // Even if ML API fails, save the attempt to DB
    try {
      const recommendation = new Recommendation({
        userId: req.user.id,
        method: 'region',
        inputData: {
          region: req.body.region,
          district: req.body.district,
          state: req.body.region
        },
        recommendations: [],
        successStatus: 'failure'
      });
      
      await recommendation.save();
    } catch (dbError) {
      console.error('Failed to save failed recommendation:', dbError);
    }
    
    if (error.response?.status === 400) {
      return res.status(400).json({ message: error.response.data.detail || error.response.data || 'Invalid input' });
    } else if (error.response?.status === 404) {
      return res.status(404).json({ message: error.response.data.detail || 'Region not found' });
    } else if (error.code === 'ECONNREFUSED') {
      return res.status(503).json({ message: 'ML service unavailable' });
    } else {
      return res.status(500).json({ message: 'Server error' });
    }
  }
});

// Update recommendation success status - FIXED
router.put('/:id/feedback', auth, async (req, res) => {
  try {
    const { successStatus, feedback } = req.body;
    
    console.log('Updating feedback for recommendation:', req.params.id, { successStatus, feedback });
    
    const recommendation = await Recommendation.findOne({
      _id: req.params.id,
      userId: req.user.id
    });
    
    if (!recommendation) {
      return res.status(404).json({ message: 'Recommendation not found' });
    }
    
    recommendation.successStatus = successStatus;
    if (feedback) recommendation.feedback = feedback;
    
    await recommendation.save();
    
    console.log('Successfully updated recommendation status:', recommendation._id);
    
    res.json(recommendation);
  } catch (error) {
    console.error('Error updating recommendation feedback:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;