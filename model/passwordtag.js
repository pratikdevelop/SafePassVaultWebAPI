const mongoose = require('mongoose');

const passwordTagSchema  = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  description: String,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
});

const PasswordTag = mongoose.model('PasswordTag', passwordTagSchema );
module.exports = PasswordTag;