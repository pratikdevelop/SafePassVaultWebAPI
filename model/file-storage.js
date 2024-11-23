const mongoose = require("mongoose");

const fileSchema = new mongoose.Schema({
  filename: String,
  originalName: String,
  path: String,
  size: Number,
  name: {
    type: String,
  },
  uploadedAt: { type: Date, default: Date.now },
  folderId: { type: mongoose.Schema.Types.ObjectId, ref: "Folder" }, // folder structure
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // ownership
  isDeleted: { type: Boolean, default: false }, // soft delete for recovery
  thumbnails: [String], // for file previews
  notes: String,
  location: {
    type: String,
    require: true,
  },
});

const file = mongoose.model("file", fileSchema);

module.exports = file;
