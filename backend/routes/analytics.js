const express = require('express');
const Recommendation = require('../models/Recommendation');
const auth = require('../middleware/auth');

const router = express.Router();


router.get('/', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    
    
    const recommendations = await Recommendation.find({ userId });
    
    const total = recommendations.length;
    const success = recommendations.filter(r => r.successStatus === 'success').length;
    const failure = recommendations.filter(r => r.successStatus === 'failure').length;
    const pending = recommendations.filter(r => r.successStatus === 'pending').length;
    
    const successRate = total > 0 ? (success / (success + failure)) * 100 : 0;
    
    
    const methodDistribution = {
      soil_params: recommendations.filter(r => r.method === 'soil_params').length,
      soil_image: recommendations.filter(r => r.method === 'soil_image').length,
      region: recommendations.filter(r => r.method === 'region').length
    };
    
    
    const cropCounts = {};
    recommendations.forEach(rec => {
      rec.recommendations.forEach(cropRec => {
        if (cropRec.crop) {
          cropCounts[cropRec.crop] = (cropCounts[cropRec.crop] || 0) + 1;
        }
      });
    });
    
    const topCrops = Object.entries(cropCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([crop, count]) => ({ crop, count }));
    
    res.json({
      stats: {
        total,
        success,
        failure,
        pending,
        successRate: Math.round(successRate)
      },
      methodDistribution,
      topCrops
    });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ message: 'Error fetching analytics data' });
  }
});

// Get recommendation history with filters
router.get('/history', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { method, status, limit = 10, page = 1 } = req.query;
    
    const query = { userId };
    
    if (method && method !== 'all') {
      query.method = method;
    }
    
    if (status && status !== 'all') {
      query.successStatus = status;
    }
    
    const skip = (page - 1) * limit;
    
    const recommendations = await Recommendation.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await Recommendation.countDocuments(query);
    
    res.json({
      recommendations,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('History error:', error);
    res.status(500).json({ message: 'Error fetching history' });
  }
});

module.exports = router;