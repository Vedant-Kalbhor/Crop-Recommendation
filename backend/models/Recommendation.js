const mongoose=require("mongoose");
const { create } = require("./User");

const RecommendationSchema=new mongoose.Schema({
    userId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User',
        required:true
    },
    method:{
        type:String,
        enum:['soil_params','soil_image','region'],
        required:true
    },
    inputData:{
        // For soil parameters
    N: Number,
    P: Number,
    K: Number,
    temperature: Number,
    humidity: Number,
    rainfall: Number,
    ph: Number,
    
    // For image analysis
    imageUrl: String,
    soilType: String,
    
    // For region analysis
    region: String,
    coordinates: [Number],
    weatherData: {
      temperature: Number,
      humidity: Number,
      rainfall: Number
    }
    },
    successStatus:{
        type:String,
        enum:['pending','success','failure'],
        default:'pending'
    },
    feedback:String,
    createAt:{
        type:Date,
        default:Date.now
    }
});

module.exports= mongoose.model('Recommendation',RecommendationSchema);