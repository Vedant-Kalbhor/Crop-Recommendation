const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') }); // Correct path to .env

const User = require('../models/User');

const hashExistingPasswords = async () => {
  try {
    // Check if MONGODB_URI is defined
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI is not defined in environment variables');
    }

    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected successfully');

    const users = await User.find();
    console.log(`Found ${users.length} users`);
    
    let updatedCount = 0;
    
    for (let user of users) {
      // Check if password is NOT hashed (bcrypt hashes start with $2b$)
      if (user.password && !user.password.startsWith('$2b$')) {
        console.log(`\nHashing password for: ${user.email}`);
        console.log(`Original password: ${user.password}`);
        
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(user.password, salt);
        user.password = hashedPassword;
        await user.save();
        
        updatedCount++;
        console.log(`✓ Password hashed for: ${user.email}`);
      } else if (user.password) {
        console.log(`✓ Password already hashed for: ${user.email}`);
      }
    }
    
    console.log(`\n=== COMPLETED ===`);
    console.log(`Total users: ${users.length}`);
    console.log(`Passwords updated: ${updatedCount}`);
    console.log(`Already hashed: ${users.length - updatedCount}`);
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    console.log('Make sure your .env file has MONGODB_URI defined');
    process.exit(1);
  }
};

// Handle script execution
hashExistingPasswords();

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\nShutting down...');
  await mongoose.connection.close();
  process.exit(0);
});