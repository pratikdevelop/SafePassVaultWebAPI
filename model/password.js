const mongoose = require('mongoose');

const passwordSchema = new mongoose.Schema({
  website: {
    type: String,
    required: true,
    trim: true,
  },
  username: {
    type: String,
    required: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
  },
  key: {
    type: String,
    required: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  shareToken: {
    type: String,
    default: null,
  },
  shareExpiration: {
    type: Date,
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now, // Set the default value to the current timestamp
  },
  updatedAt: {
    type: Date,
    default: Date.now, // Set the default value to the current timestamp
  },
});

const Password = mongoose.model('Password', passwordSchema);

module.exports = Password;
