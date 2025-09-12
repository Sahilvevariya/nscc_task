// Database connection helper (mongoose)
const mongoose = require('mongoose');

async function connectDB(uri) {
  if (!uri) throw new Error('MONGO_URI not set in env');
  try {
    await mongoose.connect(uri, {
      // options kept minimal; Mongoose handles defaults
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('MongoDB connected');
  } catch (err) {
    console.error('MongoDB connection error', err.message);
    throw err;
  }
}

module.exports = connectDB;
