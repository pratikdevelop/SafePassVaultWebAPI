const mongoose = require('mongoose');

const tagSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  description: String,
  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  tagType: {
    type: String,
    required: true,
    enum: ['passwords', 'notes', 'cards', 'proof', 'files', 'address', 'secrets'], // Add the types you want to support
    default: 'passwords' // Default type, can be changed as needed
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
});

const tag = mongoose.model('tag', tagSchema);
module.exports = tag;