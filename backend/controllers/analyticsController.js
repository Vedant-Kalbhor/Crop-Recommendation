const Recommendation = require('../models/Recommendation');
const User = require('../models/User');

// Get comprehensive analytics for dashboard
const getDashboardAnalytics = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Basic statistics
    const totalRecommendations = await Recommendation.countDocuments({ userId });
    const successRecommendations = await Recommendation.countDocuments({ 
      userId, 
      successStatus: 'success' 
    });
    const failureRecommendations = await Recommendation.countDocuments({ 
      userId, 
      successStatus: 'failure' 
    });
    const pendingRecommendations = await Recommendation.countDocuments({ 
      userId, 
      successStatus: 'pending' 
    });
    
    const successRate = totalRecommendations > 0 
      ? (successRecommendations / (successRecommendations + failureRecommendations)) * 100 
      : 0;
    
    // Method distribution
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
    
    // Monthly trend
    const monthlyTrend = await Recommendation.aggregate([
      { $match: { userId: req.user._id } },
      { $group: { 
        _id: { 
          year: { $year: '$createdAt' }, 
          month: { $month: '$createdAt' } 
        },
        count: { $sum: 1 },
        success: {
          $sum: { $cond: [{ $eq: ['$successStatus', 'success'] }, 1, 0] }
        },
        failure: {
          $sum: { $cond: [{ $eq: ['$successStatus', 'failure'] }, 1, 0] }
        }
      }},
      { $sort: { '_id.year': 1, '_id.month': 1 } },
      { $limit: 6 },
      { $project: {
        period: { 
          $dateToString: { 
            format: '%Y-%m', 
            date: { 
              $dateFromParts: { 
                year: '$_id.year', 
                month: '$_id.month' 
              } 
            } 
          } 
        },
        count: 1,
        success: 1,
        failure: 1,
        _id: 0
      }}
    ]);
    
    // Top recommended crops
    const topCrops = await Recommendation.aggregate([
      { $match: { userId: req.user._id } },
      { $unwind: '$recommendations' },
      { $group: { 
        _id: '$recommendations.crop', 
        count: { $sum: 1 },
        avgConfidence: { $avg: '$recommendations.confidence' },
        successRate: {
          $avg: {
            $cond: [{ $eq: ['$successStatus', 'success'] }, 1, 0]
          }
        }
      }},
      { $sort: { count: -1 } },
      { $limit: 5 },
      { $project: { 
        crop: '$_id', 
        count: 1, 
        avgConfidence: { $round: ['$avgConfidence', 2] },
        successRate: { $multiply: [{ $round: ['$successRate', 2] }, 100] },
        _id: 0 
      }}
    ]);
    
    // Weather correlation (simplified)
    const weatherCorrelation = await Recommendation.aggregate([
      { $match: { 
        userId: req.user._id,
        'inputData.weatherData': { $exists: true }
      }},
      { $group: {
        _id: null,
        avgTemp: { $avg: '$inputData.weatherData.temperature' },
        avgHumidity: { $avg: '$inputData.weatherData.humidity' },
        avgRainfall: { $avg: '$inputData.weatherData.rainfall' }
      }},
      { $project: {
        _id: 0,
        avgTemp: { $round: ['$avgTemp', 1] },
        avgHumidity: { $round: ['$avgHumidity', 1] },
        avgRainfall: { $round: ['$avgRainfall', 1] }
      }}
    ]);
    
    res.json({
      overview: {
        total: totalRecommendations,
        success: successRecommendations,
        failure: failureRecommendations,
        pending: pendingRecommendations,
        successRate: Math.round(successRate)
      },
      methodDistribution,
      monthlyTrend,
      topCrops,
      weatherCorrelation: weatherCorrelation[0] || {}
    });
  } catch (error) {
    console.error('Dashboard analytics error:', error);
    res.status(500).json({ message: 'Error fetching analytics data' });
  }
};

// Get success rate by method
const getSuccessRateByMethod = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const successRates = await Recommendation.aggregate([
      { $match: { userId: req.user._id } },
      { $group: {
        _id: {
          method: '$method',
          status: '$successStatus'
        },
        count: { $sum: 1 }
      }},
      { $group: {
        _id: '$_id.method',
        total: { $sum: '$count' },
        success: {
          $sum: {
            $cond: [{ $eq: ['$_id.status', 'success'] }, '$count', 0]
          }
        },
        failure: {
          $sum: {
            $cond: [{ $eq: ['$_id.status', 'failure'] }, '$count', 0]
          }
        }
      }},
      { $project: {
        method: '$_id',
        total: 1,
        success: 1,
        failure: 1,
        successRate: {
          $cond: [
            { $gt: [{ $add: ['$success', '$failure'] }, 0] },
            { $multiply: [{ $divide: ['$success', { $add: ['$success', '$failure'] }] }, 100] },
            0
          ]
        },
        _id: 0
      }},
      { $sort: { successRate: -1 } }
    ]);
    
    res.json(successRates);
  } catch (error) {
    console.error('Success rate by method error:', error);
    res.status(500).json({ message: 'Error fetching success rates' });
  }
};

// Get crop performance analytics
const getCropPerformance = async (req, res) => {
  try {
    const userId = req.user.id;
    const { crop } = req.query;
    
    const matchStage = { userId: req.user._id };
    if (crop) {
      matchStage['recommendations.crop'] = crop;
    }
    
    const cropPerformance = await Recommendation.aggregate([
      { $match: matchStage },
      { $unwind: '$recommendations' },
      { $group: {
        _id: '$recommendations.crop',
        totalRecommendations: { $sum: 1 },
        avgConfidence: { $avg: '$recommendations.confidence' },
        successCount: {
          $sum: {
            $cond: [{ $eq: ['$successStatus', 'success'] }, 1, 0]
          }
        },
        failureCount: {
          $sum: {
            $cond: [{ $eq: ['$successStatus', 'failure'] }, 1, 0]
          }
        },
        pendingCount: {
          $sum: {
            $cond: [{ $eq: ['$successStatus', 'pending'] }, 1, 0]
          }
        }
      }},
      { $project: {
        crop: '$_id',
        totalRecommendations: 1,
        avgConfidence: { $round: ['$avgConfidence', 3] },
        successCount: 1,
        failureCount: 1,
        pendingCount: 1,
        successRate: {
          $cond: [
            { $gt: [{ $add: ['$successCount', '$failureCount'] }, 0] },
            { $multiply: [{ $divide: ['$successCount', { $add: ['$successCount', '$failureCount'] }] }, 100] },
            0
          ]
        },
        _id: 0
      }},
      { $sort: { totalRecommendations: -1 } },
      { $limit: crop ? 1 : 20 }
    ]);
    
    res.json(cropPerformance);
  } catch (error) {
    console.error('Crop performance error:', error);
    res.status(500).json({ message: 'Error fetching crop performance data' });
  }
};

// Get seasonal trends
const getSeasonalTrends = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const seasonalTrends = await Recommendation.aggregate([
      { $match: { userId: req.user._id } },
      { $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' }
        },
        count: { $sum: 1 },
        successRate: {
          $avg: {
            $cond: [{ $eq: ['$successStatus', 'success'] }, 1, 0]
          }
        }
      }},
      { $sort: { '_id.year': 1, '_id.month': 1 } },
      { $project: {
        period: {
          $dateToString: {
            format: '%Y-%m',
            date: {
              $dateFromParts: {
                year: '$_id.year',
                month: '$_id.month'
              }
            }
          }
        },
        count: 1,
        successRate: { $multiply: [{ $round: ['$successRate', 3] }, 100] },
        _id: 0
      }}
    ]);
    
    res.json(seasonalTrends);
  } catch (error) {
    console.error('Seasonal trends error:', error);
    res.status(500).json({ message: 'Error fetching seasonal trends' });
  }
};

module.exports = {
  getDashboardAnalytics,
  getSuccessRateByMethod,
  getCropPerformance,
  getSeasonalTrends
};