/**
 * MongoDB Connection Configuration
 * Connects to MongoDB using Mongoose
 */

const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`✅ MongoDB Connected`);
  } catch (error) {
    console.error(`\n❌ MongoDB Connection Error: ${error.message}`);
    console.error(`\n💡 Make sure MongoDB is running:`);
    console.error(`   • Local: Start mongod service or install MongoDB Community Server`);
    console.error(`   • Atlas: Update MONGO_URI in .env with your Atlas connection string`);
    console.error(`   • Download: https://www.mongodb.com/try/download/community\n`);
    process.exit(1);
  }
};

module.exports = connectDB;
