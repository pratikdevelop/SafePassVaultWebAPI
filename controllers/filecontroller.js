const File = require('../model/file-storage');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

module.exports = {
  uploadFile: async (req, res) => {
    try {
      const { originalname, path: filePath, size } = req.file;
      const { folderId, ownerId, sharedWith, encrypted, offlineAccess } = req.body;

      // Validate inputs
      if (!originalname || !filePath || !size || !ownerId) {
        return res.status(400).json({ message: 'Missing required fields' });
      }

      // Create file document
      const newFile = new File({
        filename: path.basename(filePath),
        originalName: originalname,
        path: filePath,
        size,
        sharedWith,
        folderId: folderId ? mongoose.Types.ObjectId(folderId) : null,
        ownerId: mongoose.Types.ObjectId(ownerId),
        encrypted: encrypted || false,
        offlineAccess: offlineAccess || false,
      });

      await newFile.save();
      res.status(201).json({ message: 'File uploaded successfully', file: newFile });
    } catch (error) {
      res.status(500).json({ message: 'Error uploading file', error: error.message });
    }
  },

  getFileById: async (req, res) => {
    try {
      const file = await File.findById(req.params.id).populate('folderId ownerId');
      if (!file || file.isDeleted) {
        return res.status(404).json({ message: 'File not found' });
      }

      res.status(200).json(file);
    } catch (error) {
      res.status(500).json({ message: 'Error retrieving file', error: error.message });
    }
  },

  updateFile: async (req, res) => {
    try {
      const { sharedWith, permissions, encrypted, offlineAccess } = req.body;
      const file = await File.findById(req.params.id);

      if (!file || file.isDeleted) {
        return res.status(404).json({ message: 'File not found' });
      }

      // Update file properties
      if (sharedWith) file.sharedWith = sharedWith;
      if (permissions) file.permissions = permissions;
      if (typeof encrypted === 'boolean') file.encrypted = encrypted;
      if (typeof offlineAccess === 'boolean') file.offlineAccess = offlineAccess;

      await file.save();
      res.status(200).json({ message: 'File updated successfully', file });
    } catch (error) {
      res.status(500).json({ message: 'Error updating file', error: error.message });
    }
  },

  deleteFile: async (req, res) => {
    try {
      const file = await File.findById(req.params.id);
      if (!file || file.isDeleted) {
        return res.status(404).json({ message: 'File not found' });
      }

      file.isDeleted = true;
      await file.save();
      res.status(200).json({ message: 'File deleted successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Error deleting file', error: error.message });
    }
  },

  restoreFile: async (req, res) => {
    try {
      const file = await File.findById(req.params.id);
      if (!file || !file.isDeleted) {
        return res.status(404).json({ message: 'File not found or not deleted' });
      }

      file.isDeleted = false;
      await file.save();
      res.status(200).json({ message: 'File restored successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Error restoring file', error: error.message });
    }
  },
  getAllFiles: async (req, res) => {
    try {
      const files = await File.find({ isDeleted: false, ownerId: req.user._id }).populate('folderId');
      res.status(200).json(files);
    } catch (error) {
      res.status(500).json({ message: 'Error retrieving files', error: error.message });
    }
  },

  permanentlyDeleteFile: async (req, res) => {
    try {
      const file = await File.findById(req.params.id);
      if (!file) {
        return res.status(404).json({ message: 'File not found' });
      }

      // Delete the file from the file system
      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }

      await file.remove();
      res.status(200).json({ message: 'File permanently deleted' });
    } catch (error) {
      res.status(500).json({ message: 'Error permanently deleting file', error: error.message });
    }
  }
};
