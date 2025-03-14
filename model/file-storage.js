const mongoose = require('mongoose');

const fileSchema = new mongoose.Schema({
  filename: String,
  originalName: String,
  path: String,
  size: Number,
  uploadedAt: { type: Date, default: Date.now },
  sharedWith: [String],
  version: { type: Number, default: 1 }, // versioning
  folderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Folder' }, // folder structure
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // ownership
  isDeleted: { type: Boolean, default: false }, // soft delete for recovery
  thumbnails: [String], // for file previews
  encrypted: { type: Boolean, default: false }, // encryption flag
  permissions: {
    type: Map,
    of: String, // 'read', 'write', 'comment'
  },
  offlineAccess: { type: Boolean, default: false }, // offline sync
  location: {
    type: String,
    require: true
  }
});

const file = mongoose.model('file', fileSchema);

module.exports = file;

