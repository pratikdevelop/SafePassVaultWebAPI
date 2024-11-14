const File = require('../model/file-storage');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const Folder = require('../model/folder')
const Invitation = require('../model/Invitation'); // Adjust the path as needed
const User = require('../model/user');
const AWS = require('aws-sdk');
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});
module.exports = {

  uploadFile: async (req, res) => {
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
        Bucket: process.env.S3_BUCKET_NAME_FILE_STORAGE,
        Key: `files/${originalname}`,
        Body: fileStream,
      };

      const response = await s3.upload(params).promise();
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
        location: response.Location
      });

      await newFile.save();

      res.status(201).json({ message: 'File uploaded successfully', file: newFile });
    } catch (error) {
      console.log(
        'eeee', error
      );

      res.status(500).json({ message: 'Error uploading file', error: error.message });
    }
  },
  getFileById: async (req, res) => {
    try {
      const file = await File.findById(req.params.id).populate('folderId ownerId');
      if (!file || file.isDeleted) {
        return res.status(404).json({ message: 'File not found' });
      }
      const fileUrl = s3.getSignedUrl('getObject', {
        Bucket: process.env.S3_BUCKET_NAME_FILE_STORAGE,
        Key: `files/${file.originalName}`,
        Expires: 400,
      });

      file.location = fileUrl;
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
      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path); // Delete the local file
      } else {
        console.log(`Local file ${file.path} not found`);
      }

      // Step 3: Delete the file from S3 (ensure the correct parameters are used)
      const params = {
        Bucket: process.env.S3_BUCKET_NAME_FILE_STORAGE, // Ensure the S3 bucket name is correct
        Key: `files/${file.originalName}`, // The correct parameter name is `Key`, not `key`
      };

      // Step 4: Perform S3 delete operation
      await s3.deleteObject(params).promise();
      await file.deleteOne();
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
      const files = await File.find({ isDeleted: false, ownerId: req.user._id }).populate('folderId').populate({
        path: "ownerId",
        select: "name"
      });
      res.status(200).json(files);
    } catch (error) {
      res.status(500).json({ message: 'Error retrieving files', error: error.message });
    }
  },
  permanentlyDeleteFile: async (req, res) => {
    try {
      // Step 1: Find the file in your database
      const file = await File.findById(req.params.id);
      if (!file) {
        return res.status(404).json({ message: 'File not found' });
      }

      // Step 2: Delete the file from the local filesystem (if it exists)
      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path); // Delete the local file
      } else {
        console.log(`Local file ${file.path} not found`);
      }

      // Step 3: Delete the file from S3 (ensure the correct parameters are used)
      const params = {
        Bucket: process.env.S3_BUCKET_NAME_FILE_STORAGE, // Ensure the S3 bucket name is correct
        Key: `files/${file.originalName}`, // The correct parameter name is `Key`, not `key`
      };

      // Step 4: Perform S3 delete operation
      const s3Response = await s3.deleteObject(params).promise();

      // Step 5: Optionally, handle response from S3
      console.log('S3 response:', s3Response);

      // Step 6: Respond to the client
      return res.status(200).json({ message: 'File permanently deleted', response: s3Response });
    } catch (error) {
      // Step 7: Handle errors properly
      console.error('Error deleting file:', error);
      return res.status(500).json({ message: 'Error permanently deleting file', error: error.message });
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
