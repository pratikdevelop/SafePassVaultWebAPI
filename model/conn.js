const mongoose = require('mongoose');
const User = require('./user')
const mongoURI = 'mongodb://localhost:27017/password-manager';
(async () => {
  try {
    await mongoose.connect(mongoURI);
    console.log('Connected to MongoDB');
  } catch (err) {
    console.error('Error connecting to MongoDB:', err);
  }
})();
