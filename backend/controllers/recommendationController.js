const mongoose = require('mongoose');
const Recommendation = require('../models/Recommendation');

// Get recommendation history for user (with pagination & filters)
const getHistory = async (req, res) => {
  try {
    const { method, status, limit = 10, page = 1 } = req.query;
    const userId = req.user.id;

    const query = { userId: mongoose.Types.ObjectId(userId) };

    if (method && method !== 'all') query.method = method;
    if (status && status !== 'all') query.successStatus = status;

    const lim = parseInt(limit, 10);
    const pg = parseInt(page, 10);
    const skip = (Math.max(pg, 1) - 1) * lim;

    const [recommendations, total] = await Promise.all([
      Recommendation.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(lim)
        .populate('userId', 'username email')
        .lean(),
      Recommendation.countDocuments(query)
    ]);

    return res.json({
      data: recommendations,
      pagination: {
        page: pg,
        limit: lim,
        total,
        pages: Math.ceil(total / lim)
      }
    });
  } catch (error) {
    console.error('Get recommendation history error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Update recommendation success status (feedback)
const updateRecommendationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { successStatus, feedback } = req.body;
    const userId = req.user.id;

    if (!['success', 'failure', 'pending'].includes(successStatus)) {
      return res.status(400).json({ message: 'Invalid successStatus value' });
    }

    const recommendation = await Recommendation.findOne({
      _id: id,
      userId: mongoose.Types.ObjectId(userId)
    });

    if (!recommendation) {
      return res.status(404).json({ message: 'Recommendation not found' });
    }

    recommendation.successStatus = successStatus;
    if (feedback) recommendation.feedback = feedback;
    await recommendation.save();

    return res.json(recommendation);
  } catch (error) {
    console.error('Update recommendation status error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};


// Get recommendation by ID
const getRecommendationById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid recommendation ID' });
    }

    const recommendation = await Recommendation.findOne({
      _id: id,
      userId: mongoose.Types.ObjectId(userId)
    }).populate('userId', 'username email');

    if (!recommendation) {
      return res.status(404).json({ message: 'Recommendation not found' });
    }

    return res.json(recommendation);
  } catch (error) {
    console.error('Get recommendation by ID error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Delete recommendation
const deleteRecommendation = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid recommendation ID' });
    }

    const recommendation = await Recommendation.findOneAndDelete({
      _id: id,
      userId: mongoose.Types.ObjectId(userId)
    });

    if (!recommendation) {
      return res.status(404).json({ message: 'Recommendation not found' });
    }

    return res.json({ message: 'Recommendation deleted successfully' });
  } catch (error) {
    console.error('Delete recommendation error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Get recommendation statistics
const getStats = async (req, res) => {
  try {
    const userId = mongoose.Types.ObjectId(req.user.id);

    const total = await Recommendation.countDocuments({ userId });
    const success = await Recommendation.countDocuments({ userId, successStatus: 'success' });
    const failure = await Recommendation.countDocuments({ userId, successStatus: 'failure' });
    const pending = await Recommendation.countDocuments({ userId, successStatus: 'pending' });

    const successRate = total > 0 ? (success / (success + failure)) * 100 : 0;

    // Get method distribution
    const methodDistribution = await Recommendation.aggregate([
      { $match: { userId } },
      {
        $group: {
          _id: '$method',
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          method: '$_id',
          count: 1,
          _id: 0
        }
      }
    ]);

    // Get top recommended crops
    const cropRecommendations = await Recommendation.aggregate([
      { $match: { userId } },
      { $unwind: '$recommendations' },
      {
        $group: {
          _id: '$recommendations.crop',
          count: { $sum: 1 },
          avgConfidence: { $avg: '$recommendations.confidence' }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 },
      {
        $project: {
          crop: '$_id',
          count: 1,
          avgConfidence: 1,
          _id: 0
        }
      }
    ]);

    return res.json({
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
    return res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getHistory,
  getRecommendationById,
  deleteRecommendation,
  getStats,
  updateRecommendationStatus
};
