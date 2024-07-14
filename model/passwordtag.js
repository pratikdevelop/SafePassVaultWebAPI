const mongoose = require('mongoose');

const passwordTagSchema  = new mongoose.Schema({
  _id: mongoose.Schema.Types.ObjectId,
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
  passwords: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Passwords'
  }]
});

const PasswordTag = mongoose.model('PasswordTag', passwordTagSchema );
module.exports = PasswordTag;