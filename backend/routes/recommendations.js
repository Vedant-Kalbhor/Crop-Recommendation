// backend/routes/recommendations.js
const express = require('express');
const axios = require('axios');
const multer = require('multer');
const FormData = require('form-data');

const auth = require('../middleware/auth');
const recommendationController = require('../controllers/recommendationController');

const router = express.Router();
const storage = multer.memoryStorage();
const upload = multer({ storage });

// ML API base URL
const ML_API_BASE = process.env.ML_API_URL || 'http://localhost:8000';

// Use controller for history & stats
router.get('/history', auth, recommendationController.getHistory);
router.get('/stats', auth, recommendationController.getStats);

// ================== Soil Params Recommendation ==================
router.post('/soil-params', auth, async (req, res) => {
  try {
    const { N, P, K, temperature, humidity, rainfall, ph } = req.body;

    // Call ML API
    const mlResp = await axios.post(`${ML_API_BASE}/predict/soil-params`, {
      N, P, K, temperature, humidity, rainfall, ph
    }, { timeout: 30000 });

    const mlData = mlResp.data || {};

    // Build controller-friendly body
    req.body = {
      method: 'soil_params',
      inputData: { N, P, K, temperature, humidity, rainfall, ph },
      recommendations: Array.isArray(mlData.recommendations) ? mlData.recommendations : [],
      status: mlData.status // ML may return explicit status
    };

    return recommendationController.createRecommendation(req, res);
  } catch (error) {
    console.error('Error getting soil parameters recommendation:', error.message, error.response?.data || '');
    if (error.code === 'ECONNREFUSED') {
      return res.status(503).json({ message: 'ML service unavailable' });
    }
    return res.status(500).json({ message: 'Server error' });
  }
});

// ================== Soil Image Recommendation ==================
router.post('/soil-image', auth, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        message: 'No image file uploaded',
        recommendations: []
      });
    }

    const formData = new FormData();
    formData.append('file', req.file.buffer, {
      filename: req.file.originalname,
      contentType: req.file.mimetype
    });

    const mlResp = await axios.post(`${ML_API_BASE}/predict/soil-image`, formData, {
      headers: formData.getHeaders(),
      timeout: 30000
    });

    const mlData = mlResp.data || {};

    req.body = {
      method: 'soil_image',
      inputData: {
        imageUrl: `uploaded-${Date.now()}-${req.file.originalname}`,
        soil_type: mlData.soil_type || mlData.soil_type || 'unknown'
      },
      recommendations: Array.isArray(mlData.recommendations) ? mlData.recommendations : [],
      status: mlData.status
    };

    return recommendationController.createRecommendation(req, res);
  } catch (error) {
    console.error('Error in soil image recommendation:', error.message, error.response?.data || error.stack);
    if (error.code === 'ECONNREFUSED') {
      return res.status(503).json({ message: 'ML service unavailable', recommendations: [] });
    }
    return res.status(500).json({ message: 'Error analyzing soil image', recommendations: [] });
  }
});

// ================== Region-based Recommendation ==================
router.post('/region', auth, async (req, res) => {
  try {
    const { region, lat, lng, lon, district } = req.body;

    if (!region && !(lat && (lng || lon))) {
      return res.status(400).json({ message: 'Either region (state) or coordinates are required' });
    }

    const payload = (lat && (lng || lon))
      ? { lat, lng: lng || lon, lon: lng || lon }
      : (district ? { region, district } : { region });

    const mlResp = await axios.post(`${ML_API_BASE}/predict/region`, payload, { timeout: 30000 });
    const mlData = mlResp.data || {};

    req.body = {
      method: 'region',
      inputData: {
        region: mlData.region || region,
        state: mlData.region || region,
        district: mlData.district || district,
        coordinates: lat && (lng || lon) ? [parseFloat(lat), parseFloat(lng || lon)] : undefined,
        weatherData: mlData.weather_data || mlData.weatherData || {}
      },
      recommendations: Array.isArray(mlData.recommendations) ? mlData.recommendations : [],
      status: mlData.status
    };

    return recommendationController.createRecommendation(req, res);
  } catch (error) {
    console.error('Error getting region-based recommendation:', error.message, error.response?.data || error.stack);
    if (error.code === 'ECONNREFUSED') {
      return res.status(503).json({ message: 'ML service unavailable' });
    }
    if (error.response?.status === 404) {
      return res.status(404).json({ message: error.response.data.detail || 'Region not found' });
    }
    return res.status(500).json({ message: 'Server error' });
  }
});

// ================== CRUD & Feedback ==================
router.get('/:id', auth, recommendationController.getRecommendationById);
router.delete('/:id', auth, recommendationController.deleteRecommendation);

const {
  getHistory,
  getRecommendationById,
  deleteRecommendation,
  getStats,
  updateRecommendationStatus
} = require('../controllers/recommendationController');

// …
router.put('/:id/feedback', auth, updateRecommendationStatus);


module.exports = router;
