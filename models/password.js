const mongoose = require('mongoose');

const passwordSchema = new mongoose.Schema({
  website: {
    type: String,
    required: true,
    trim: true,
  },
  name: {
    type: String,
    default: null
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
  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  totp: {
    type: Number,
  },
  description: {
    type: String
  },
  favorite: {
    type: Boolean,
    default: false
  },
  modifiedby: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  tags: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'tag'
  }],
  comments: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment'
  }],
  folder: {  // New field to associate with a folder
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Folder',
    required: true // Make it required if every password must belong to a folder
  }
});

const Password = mongoose.model('Password', passwordSchema);

module.exports = Password;
