const File = require('../model/file-storage');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const Folder = require('../model/folder')
const Invitation = require('../model/Invitation'); // Adjust the path as needed
const User = require('../model/user');
const AWS = require('aws-sdk');
const { constants } = require('crypto');

module.exports = {

  uploadFile : async (req, res) => {
    try {
      const { originalname, path: filePath, size } = req.file;
      const { folderId, sharedWith, encrypted = false, offlineAccess = false } = req.body;
  
      if (!originalname || !filePath) {
        return res.status(400).json({ message: 'Missing required fields' });
      }
  
      // Create file stream
      const fileStream = fs.createReadStream(filePath);
  
      // Upload file to S3
      const params = {
        Bucket: 'file-storage',
        Key: originalname,
        Body: fileStream,
      };
  
      const response = await s3.upload(params).promise();
      console.log('res', response);
      
  
      // Create file document
      const newFile = new File({
        filename: path.basename(filePath),
        originalName: originalname,
        path: filePath,
        size,
        sharedWith,
        folderId: folderId || null,
        ownerId: req.user._id,
        encrypted,
        offlineAccess,
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
  },
  createFolder: async (req, res) => {
    try {
      const ownerId = req.user._id;
      const { name, parentId } = req.body;

      // Validate inputs
      if (!name || !ownerId) {
        return res.status(400).json({ message: 'Folder name and owner ID are required' });
      }

      // Check if a folder with the same name exists in the same parent folder
      const existingFolder = await Folder.findOne({ name, ownerId, parentId });
      if (existingFolder) {
        return res.status(409).json({ message: 'Folder with this name already exists' });
      }

      // Create folder document
      const newFolder = new Folder({
        name,
        user: ownerId,
        parentId: parentId ? parentId : null,
      });

      await newFolder.save();
      res.status(201).json({ message: 'Folder created successfully', folder: newFolder });
    } catch (error) {
      res.status(500).json({ message: 'Error creating folder', error: error.message });
    }
  },
  searchFolders: async (req, res) => {
    try {
      const ownerId = req.user._id;
      const { searchTerm } = req.query;

      // Validate inputs
      if (!searchTerm || !ownerId) {
        return res.status(400).json({ message: 'Search term and owner ID are required' });
      }


      // Perform a case-insensitive search
      const folders = await Folder.find({
        name: { $regex: new RegExp(searchTerm, 'i') }, // Case-insensitive search
        user: ownerId // Ensure ownerId is valid ObjectId
      }).exec(); // Ensure the query executes

      res.status(200).json(folders);
    } catch (error) {
      res.status(500).json({ message: 'Error searching folders', error: error.message });
    }
  },
  
  searchUsers: async (req, res) => {
    try {
      const senderId = req.user._id; // Get the sender ID from the request user
      const { searchTerm } = req.params;
      if (!senderId) {
        return res.status(400).json({ message: 'Sender ID is required' });
      }

      // If no search term is provided, return an empty array or a message
      if (!searchTerm) {
        return res.status(400).json({ message: 'Search term is required' });
      }

      // Perform a case-insensitive search on name or email
      const invitations = await Invitation.aggregate([
        {
          $match: { sender: senderId }
        },
        {
          $lookup: {
            from: 'users', // Collection name in MongoDB
            localField: 'recipient',
            foreignField: '_id',
            as: 'recipientDetails'
          }
        },
        {
          $unwind: '$recipientDetails'
        },
        {
          $match: {
            $or: [
              { 'recipientDetails.name': { $regex: new RegExp(searchTerm, 'i') } },
              { 'recipientDetails.email': { $regex: new RegExp(searchTerm, 'i') } }
            ]
          }
        }
      ]);

      res.status(200).json(invitations);
    } catch (error) {
      res.status(500).json({ message: 'Error searching invitations', error: error.message });
    }
  }
};
