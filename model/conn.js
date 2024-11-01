const mongoose = require('mongoose');
const User = require('./user')
// const mongoURI =`mongodb://localhost:27017/password-manager?retryWrites=true&w=majority`;
const mongoURI =`mongodb+srv://${process.env.MONGO_DB_USERNAME}:${process.env.MONGO_DB_PASSWORD}@cluster0.nt431ty.mongodb.net/${process.env.MONGO_DB}?retryWrites=true&w=majority`;
(async () => {
  try {
    await mongoose.connect(mongoURI);
    console.log('Connected to MongoDB');
  } catch (err) {
    console.error('Error connecting to MongoDB:', err);
  }
})();
