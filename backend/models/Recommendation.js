const mongoose = require("mongoose");

const RecommendationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  method: {
    type: String,
    enum: ['soil_params', 'soil_image', 'region'],
    required: true
  },
  inputData: {
    // Soil parameters
    N: Number,
    P: Number,
    K: Number,
    temperature: Number,
    humidity: Number,
    rainfall: Number,
    ph: Number,

    // ✅ Use snake_case to match ML API
    imageUrl: String,
    soil_type: String,

    // Region analysis
    region: String,
    coordinates: [Number],
    weatherData: {
      temperature: Number,
      humidity: Number,
      rainfall: Number
    }
  },
  successStatus: {
    type: String,
    enum: ['pending', 'success', 'failure'],
    default: 'pending'
  },
  feedback: String,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Recommendation', RecommendationSchema);
