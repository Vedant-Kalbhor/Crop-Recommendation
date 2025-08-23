const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  location: { type: String, enum: ["Point"], default: [0, 0] },
  region: String,
  createdAt: { type: Date, default: Date.now },
});


UserSchema.methods.correctPassword= async function(candidatePassword,userPassword){
    return await bcrypt.compare(candidatePassword,userPassword);
};

module.exports= mongoose.model("User", UserSchema);