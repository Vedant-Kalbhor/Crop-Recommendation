const Recommendation = require('../models/Recommendation');

// Get recommendation history for user
const getHistory = async (req, res) => {
  try {
    const { method, status, limit = 10, page = 1 } = req.query;
    const userId = req.user.id;
    
    const query = { userId };
    
    if (method && method !== 'all') {
      query.method = method;
    }
    
    if (status && status !== 'all') {
      query.successStatus = status;
    }
    
    const skip = (page - 1) * parseInt(limit);
    
    const recommendations = await Recommendation.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('userId', 'username email');
    
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
    console.error('Get recommendation history error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get recommendation by ID
const getRecommendationById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    const recommendation = await Recommendation.findOne({
      _id: id,
      userId
    }).populate('userId', 'username email');
    
    if (!recommendation) {
      return res.status(404).json({ message: 'Recommendation not found' });
    }
    
    res.json(recommendation);
  } catch (error) {
    console.error('Get recommendation error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete recommendation
const deleteRecommendation = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    const recommendation = await Recommendation.findOneAndDelete({
      _id: id,
      userId
    });
    
    if (!recommendation) {
      return res.status(404).json({ message: 'Recommendation not found' });
    }
    
    res.json({ message: 'Recommendation deleted successfully' });
  } catch (error) {
    console.error('Delete recommendation error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get recommendation statistics
const getStats = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const total = await Recommendation.countDocuments({ userId });
    const success = await Recommendation.countDocuments({ 
      userId, 
      successStatus: 'success' 
    });
    const failure = await Recommendation.countDocuments({ 
      userId, 
      successStatus: 'failure' 
    });
    const pending = await Recommendation.countDocuments({ 
      userId, 
      successStatus: 'pending' 
    });
    
    const successRate = total > 0 ? (success / (success + failure)) * 100 : 0;
    
    // Get method distribution
    const methodDistribution = await Recommendation.aggregate([
      { $match: { userId: req.user._id } },
      { $group: { 
        _id: '$method', 
        count: { $sum: 1 } 
      }},
      { $project: { 
        method: '$_id', 
        count: 1, 
        _id: 0 
      }}
    ]);
    
    // Get top recommended crops
    const cropRecommendations = await Recommendation.aggregate([
      { $match: { userId: req.user._id } },
      { $unwind: '$recommendations' },
      { $group: { 
        _id: '$recommendations.crop', 
        count: { $sum: 1 },
        avgConfidence: { $avg: '$recommendations.confidence' }
      }},
      { $sort: { count: -1 } },
      { $limit: 10 },
      { $project: { 
        crop: '$_id', 
        count: 1, 
        avgConfidence: 1, 
        _id: 0 
      }}
    ]);
    
    res.json({
      stats: {
        total,
        success,
        failure,
        pending,
        successRate: Math.round(successRate)
      },
      methodDistribution,
      topCrops: cropRecommendations
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getHistory,
  getRecommendationById,
  deleteRecommendation,
  getStats
};