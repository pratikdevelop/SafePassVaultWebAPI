const mongoose = require('mongoose');

const passwordSchema = new mongoose.Schema({
  folder: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Folder',
    required: true
  },
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
  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  totp: {
    type: Number,
  },
  name: {
    type: String,
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
    default: Date.now, // Set the default value to the current timestamp
  },
  updatedAt: {
    type: Date,
    default: Date.now, // Set the default value to the current timestamp
  },
});

const Password = mongoose.model('Password', passwordSchema);

module.exports = Password;
