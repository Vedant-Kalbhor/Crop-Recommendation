const mongoose = require('mongoose');
const Recommendation = require('../models/Recommendation');
const getHistory = async (req, res) => {
  try {
    const { method, status, limit = 10, page = 1 } = req.query;
    const userId = req.user.id;

    const query = { userId: mongoose.Types.ObjectId(userId) };

    if (method && method !== 'all') query.method = method;
    if (status && status !== 'all') query.successStatus = status;

    const lim = parseInt(limit, 10);
    const pg = Math.max(parseInt(page, 10), 1);
    const skip = (pg - 1) * lim;

    const [recommendations, total] = await Promise.all([
      Recommendation.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(lim)
        .lean(),
      Recommendation.countDocuments(query)
    ]);

    // !! IMPORTANT: Frontend expects { data: [...], pagination: {...} }
    return res.json({
      data: recommendations,
      pagination: {
        page: pg,
        limit: lim,
        total,
        pages: Math.ceil(total / lim)
      }
    });
  } catch (err) {
    console.error('Get recommendation history error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};// Get recommendation by ID
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
    }).lean();

    if (!recommendation) return res.status(404).json({ message: 'Recommendation not found' });

    return res.json(recommendation);
  } catch (err) {
    console.error('Get recommendation by ID error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};// Delete recommendation
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

    if (!recommendation) return res.status(404).json({ message: 'Recommendation not found' });

    return res.json({ message: 'Recommendation deleted successfully' });
  } catch (err) {
    console.error('Delete recommendation error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};// Update recommendation status + feedback (used by Feedback page)
const updateRecommendationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { successStatus, feedback } = req.body;
    const userId = req.user.id;

    if (!['success', 'failure', 'pending'].includes(successStatus)) {
      return res.status(400).json({ message: 'Invalid successStatus' });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid recommendation ID' });
    }

    const rec = await Recommendation.findOne({
      _id: id,
      userId: mongoose.Types.ObjectId(userId)
    });

    if (!rec) return res.status(404).json({ message: 'Recommendation not found' });

    rec.successStatus = successStatus;
    if (feedback !== undefined) rec.feedback = feedback;
    await rec.save();

    return res.json(rec);
  } catch (err) {
    console.error('Update recommendation status error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};// Get simple stats for user
const getStats = async (req, res) => {
  try {
    const userId = mongoose.Types.ObjectId(req.user.id);

    const total = await Recommendation.countDocuments({ userId });
    const success = await Recommendation.countDocuments({ userId, successStatus: 'success' });
    const failure = await Recommendation.countDocuments({ userId, successStatus: 'failure' });
    const pending = await Recommendation.countDocuments({ userId, successStatus: 'pending' });

    const successRate = total > 0 ? (success / (total)) * 100 : 0; // Success/Total, simpler for dashboard

    return res.json({
      stats: {
        total,
        success,
        failure,
        pending,
        successRate: Math.round(successRate)
      }
    });
  } catch (err) {
    console.error('Get stats error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};module.exports = {
  getHistory,
  getRecommendationById,
  deleteRecommendation,
  updateRecommendationStatus,
  getStats
};