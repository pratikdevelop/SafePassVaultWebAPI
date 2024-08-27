const mongoose = require('mongoose');

const tagSchema  = new mongoose.Schema({
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

const tag = mongoose.model('tag', tagSchema );
module.exports = tag;