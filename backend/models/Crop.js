const mongoose = require('mongoose');

// Crop Schema for storing crop information and characteristics
const CropSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Crop name is required'],
    trim: true,
    unique: true,
    index: true
  },
  scientificName: {
    type: String,
    trim: true
  },
  family: {
    type: String,
    trim: true
  },
  category: {
    type: String,
    enum: [
      'cereals',
      'pulses',
      'vegetables',
      'fruits',
      'oilseeds',
      'fiber',
      'plantation',
      'spices',
      'medicinal',
      'forage',
      'others'
    ],
    required: [true, 'Crop category is required']
  },
  description: {
    type: String,
    trim: true
  },
  // Ideal soil parameters for this crop
  idealConditions: {
    soil: {
      type: {
        type: String,
        enum: ['clay', 'sandy', 'loamy', 'silty', 'peaty', 'chalky', 'any'],
        default: 'any'
      },
      ph: {
        min: {
          type: Number,
          min: 0,
          max: 14,
          default: 5.5
        },
        max: {
          type: Number,
          min: 0,
          max: 14,
          default: 7.0
        }
      },
      nitrogen: {
        min: {
          type: Number,
          min: 0,
          max: 140,
          default: 20
        },
        max: {
          type: Number,
          min: 0,
          max: 140,
          default: 80
        }
      },
      phosphorus: {
        min: {
          type: Number,
          min: 0,
          max: 145,
          default: 15
        },
        max: {
          type: Number,
          min: 0,
          max: 145,
          default: 60
        }
      },
      potassium: {
        min: {
          type: Number,
          min: 0,
          max: 205,
          default: 20
        },
        max: {
          type: Number,
          min: 0,
          max: 205,
          default: 100
        }
      }
    },
    climate: {
      temperature: {
        min: {
          type: Number,
          min: -20,
          max: 50,
          default: 10
        },
        max: {
          type: Number,
          min: -20,
          max: 50,
          default: 30
        }
      },
      humidity: {
        min: {
          type: Number,
          min: 0,
          max: 100,
          default: 40
        },
        max: {
          type: Number,
          min: 0,
          max: 100,
          default: 80
        }
      },
      rainfall: {
        min: {
          type: Number,
          min: 0,
          max: 500,
          default: 50
        },
        max: {
          type: Number,
          min: 0,
          max: 500,
          default: 200
        }
      },
      altitude: {
        min: {
          type: Number,
          min: 0,
          max: 5000,
          default: 0
        },
        max: {
          type: Number,
          min: 0,
          max: 5000,
          default: 2000
        }
      }
    },
    season: {
      type: String,
      enum: ['spring', 'summer', 'autumn', 'winter', 'monsoon', 'any', 'multiple'],
      default: 'any'
    }
  },
  // Growth characteristics
  growthInfo: {
    duration: {
      min: {
        type: Number,
        min: 0,
        default: 30
      }, // days
      max: {
        type: Number,
        min: 0,
        default: 120
      } // days
    },
    waterRequirements: {
      type: String,
      enum: ['low', 'medium', 'high', 'very high'],
      default: 'medium'
    },
    sunlight: {
      type: String,
      enum: ['full', 'partial', 'shade'],
      default: 'full'
    }
  },
  // Regional suitability
  regions: [{
    region: {
      type: String,
      required: true,
      trim: true
    },
    suitability: {
      type: String,
      enum: ['excellent', 'good', 'moderate', 'poor', 'not recommended'],
      default: 'good'
    },
    season: {
      type: String,
      trim: true
    }
  }],
  // Yield information
  yieldInfo: {
    average: {
      type: Number,
      min: 0
    }, // kg per hectare
    unit: {
      type: String,
      default: 'kg/ha'
    },
    factors: [{
      type: String,
      trim: true
    }] // Factors affecting yield
  },
  // Economic information
  economicInfo: {
    marketValue: {
      type: Number,
      min: 0
    }, // price per kg
    demand: {
      type: String,
      enum: ['high', 'medium', 'low'],
      default: 'medium'
    },
    exportPotential: {
      type: Boolean,
      default: false
    }
  },
  // Pest and disease resistance
  resistance: {
    pests: [{
      name: String,
      resistance: {
        type: String,
        enum: ['high', 'medium', 'low', 'none'],
        default: 'medium'
      }
    }],
    diseases: [{
      name: String,
      resistance: {
        type: String,
        enum: ['high', 'medium', 'low', 'none'],
        default: 'medium'
      }
    }]
  },
  // Fertilizer requirements
  fertilizerRequirements: [{
    type: {
      type: String,
      enum: ['nitrogen', 'phosphorus', 'potassium', 'organic', 'micronutrients'],
      required: true
    },
    amount: {
      type: Number,
      min: 0,
      required: true
    },
    unit: {
      type: String,
      default: 'kg/ha'
    },
    timing: String,
    method: String
  }],
  // Companion plants
  companionPlants: [{
    type: String,
    trim: true
  }],
  // Incompatible plants
  incompatiblePlants: [{
    type: String,
    trim: true
  }],
  // Harvesting information
  harvesting: {
    method: String,
    indicators: [String], // Signs that crop is ready for harvest
    storage: {
      conditions: String,
      duration: String
    }
  },
  // Nutritional information
  nutritionalValue: {
    calories: Number, // per 100g
    protein: Number, // per 100g
    carbs: Number, // per 100g
    fat: Number, // per 100g
    vitamins: [String],
    minerals: [String]
  },
  // Images and media
  images: [{
    url: {
      type: String,
      required: true
    },
    caption: String,
    isPrimary: {
      type: Boolean,
      default: false
    }
  }],
  // References and sources
  references: [{
    title: String,
    url: String,
    type: {
      type: String,
      enum: ['research', 'article', 'government', 'other']
    }
  }],
  // Metadata
  isActive: {
    type: Boolean,
    default: true
  },
  popularity: {
    type: Number,
    min: 0,
    default: 0
  },
  successRate: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  recommendationCount: {
    type: Number,
    min: 0,
    default: 0
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  lastUpdatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
CropSchema.index({ name: 1 });
CropSchema.index({ category: 1 });
CropSchema.index({ 'idealConditions.soil.type': 1 });
CropSchema.index({ 'idealConditions.climate.temperature.min': 1, 'idealConditions.climate.temperature.max': 1 });
CropSchema.index({ popularity: -1 });
CropSchema.index({ successRate: -1 });
CropSchema.index({ isActive: 1 });

// Virtual for full scientific name
CropSchema.virtual('fullScientificName').get(function() {
  return this.scientificName ? `${this.family} ${this.scientificName}` : '';
});

// Virtual for ideal pH range display
CropSchema.virtual('idealPhRange').get(function() {
  return `${this.idealConditions.soil.ph.min} - ${this.idealConditions.soil.ph.max}`;
});

// Virtual for ideal temperature range display
CropSchema.virtual('idealTempRange').get(function() {
  return `${this.idealConditions.climate.temperature.min}°C - ${this.idealConditions.climate.temperature.max}°C`;
});

// Virtual for growth duration display
CropSchema.virtual('growthDuration').get(function() {
  return `${this.growthInfo.duration.min} - ${this.growthInfo.duration.max} days`;
});

// Method to check if crop is suitable for given soil parameters
CropSchema.methods.isSuitableForSoil = function(soilParams) {
  const { N, P, K, ph } = soilParams;
  const soil = this.idealConditions.soil;
  
  const withinPh = ph >= soil.ph.min && ph <= soil.ph.max;
  const withinN = N >= soil.nitrogen.min && N <= soil.nitrogen.max;
  const withinP = P >= soil.phosphorus.min && P <= soil.phosphorus.max;
  const withinK = K >= soil.potassium.min && K <= soil.potassium.max;
  
  return {
    suitable: withinPh && withinN && withinP && withinK,
    details: {
      ph: withinPh,
      nitrogen: withinN,
      phosphorus: withinP,
      potassium: withinK
    }
  };
};

// Method to check if crop is suitable for given climate conditions
CropSchema.methods.isSuitableForClimate = function(climateParams) {
  const { temperature, humidity, rainfall } = climateParams;
  const climate = this.idealConditions.climate;
  
  const withinTemp = temperature >= climate.temperature.min && temperature <= climate.temperature.max;
  const withinHumidity = humidity >= climate.humidity.min && humidity <= climate.humidity.max;
  const withinRainfall = rainfall >= climate.rainfall.min && rainfall <= climate.rainfall.max;
  
  return {
    suitable: withinTemp && withinHumidity && withinRainfall,
    details: {
      temperature: withinTemp,
      humidity: withinHumidity,
      rainfall: withinRainfall
    }
  };
};

// Method to calculate suitability score for given parameters
CropSchema.methods.calculateSuitabilityScore = function(soilParams, climateParams) {
  const soilSuitability = this.isSuitableForSoil(soilParams);
  const climateSuitability = this.isSuitableForClimate(climateParams);
  
  let score = 0;
  let totalFactors = 0;
  
  // Soil factors (60% weight)
  if (soilParams.ph !== undefined) {
    const phDiff = Math.abs(soilParams.ph - (this.idealConditions.soil.ph.min + this.idealConditions.soil.ph.max) / 2);
    const phScore = Math.max(0, 1 - (phDiff / 3.5)); // Max 1.5 deviation each way
    score += phScore * 0.15;
    totalFactors += 0.15;
  }
  
  if (soilParams.N !== undefined) {
    const nDiff = Math.abs(soilParams.N - (this.idealConditions.soil.nitrogen.min + this.idealConditions.soil.nitrogen.max) / 2);
    const nScore = Math.max(0, 1 - (nDiff / 35)); // Max 35 deviation each way
    score += nScore * 0.15;
    totalFactors += 0.15;
  }
  
  if (soilParams.P !== undefined) {
    const pDiff = Math.abs(soilParams.P - (this.idealConditions.soil.phosphorus.min + this.idealConditions.soil.phosphorus.max) / 2);
    const pScore = Math.max(0, 1 - (pDiff / 30)); // Max 30 deviation each way
    score += pScore * 0.15;
    totalFactors += 0.15;
  }
  
  if (soilParams.K !== undefined) {
    const kDiff = Math.abs(soilParams.K - (this.idealConditions.soil.potassium.min + this.idealConditions.soil.potassium.max) / 2);
    const kScore = Math.max(0, 1 - (kDiff / 40)); // Max 40 deviation each way
    score += kScore * 0.15;
    totalFactors += 0.15;
  }
  
  // Climate factors (40% weight)
  if (climateParams.temperature !== undefined) {
    const tempDiff = Math.abs(climateParams.temperature - (this.idealConditions.climate.temperature.min + this.idealConditions.climate.temperature.max) / 2);
    const tempScore = Math.max(0, 1 - (tempDiff / 10)); // Max 10°C deviation
    score += tempScore * 0.20;
    totalFactors += 0.20;
  }
  
  if (climateParams.rainfall !== undefined) {
    const rainDiff = Math.abs(climateParams.rainfall - (this.idealConditions.climate.rainfall.min + this.idealConditions.climate.rainfall.max) / 2);
    const rainScore = Math.max(0, 1 - (rainDiff / 75)); // Max 75mm deviation
    score += rainScore * 0.20;
    totalFactors += 0.20;
  }
  
  // Normalize score if not all factors are provided
  if (totalFactors > 0) {
    score = (score / totalFactors) * 100;
  }
  
  return Math.min(100, Math.max(0, Math.round(score)));
};

// Static method to find crops by region suitability
CropSchema.statics.findByRegion = function(region, suitability = 'good') {
  return this.find({
    'regions.region': new RegExp(region, 'i'),
    'regions.suitability': { $in: ['excellent', 'good', 'moderate'] },
    isActive: true
  }).sort({ 'regions.suitability': -1, popularity: -1 });
};

// Static method to find crops by soil type
CropSchema.statics.findBySoilType = function(soilType) {
  return this.find({
    $or: [
      { 'idealConditions.soil.type': soilType },
      { 'idealConditions.soil.type': 'any' }
    ],
    isActive: true
  }).sort({ popularity: -1, successRate: -1 });
};

// Static method to find crops by climate conditions
CropSchema.statics.findByClimate = function(temperature, rainfall) {
  return this.find({
    'idealConditions.climate.temperature.min': { $lte: temperature },
    'idealConditions.climate.temperature.max': { $gte: temperature },
    'idealConditions.climate.rainfall.min': { $lte: rainfall },
    'idealConditions.climate.rainfall.max': { $gte: rainfall },
    isActive: true
  }).sort({ successRate: -1, popularity: -1 });
};

// Static method to update crop popularity
CropSchema.statics.incrementPopularity = async function(cropId) {
  return this.findByIdAndUpdate(
    cropId,
    { $inc: { popularity: 1, recommendationCount: 1 } },
    { new: true }
  );
};

// Static method to update success rate
CropSchema.statics.updateSuccessRate = async function(cropId, success) {
  const crop = await this.findById(cropId);
  if (!crop) return null;

  const newSuccessCount = success ? 1 : 0;
  const totalRecommendations = crop.recommendationCount + 1;
  const newSuccessRate = ((crop.successRate * crop.recommendationCount) + newSuccessCount) / totalRecommendations;

  return this.findByIdAndUpdate(
    cropId,
    {
      $inc: { recommendationCount: 1 },
      $set: { successRate: Math.round(newSuccessRate * 100) }
    },
    { new: true }
  );
};

// Pre-save middleware to ensure scientific name is properly formatted
CropSchema.pre('save', function(next) {
  if (this.scientificName) {
    this.scientificName = this.scientificName.trim();
  }
  next();
});

// Pre-save middleware to update lastUpdatedBy
CropSchema.pre('save', function(next) {
  if (this.isModified() && !this.isNew) {
    this.lastUpdatedBy = this.constructor.currentUserId;
  }
  next();
});

module.exports = mongoose.model('Crop', CropSchema);