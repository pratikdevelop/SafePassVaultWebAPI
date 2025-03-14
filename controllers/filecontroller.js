const File = require('../models/file-storage');
const fs = require('fs');
const path = require('path');
const Folder = require('../models/folder');
const Invitation = require('../models/Invitation'); // Adjust the path as needed
const AWS = require('aws-sdk');
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});
const AuditLog = require('../models/Auditlogs'); // Import the Audit Log model

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

      // Create an audit log entry for the upload action
      await AuditLog.create({
        userId: req.user._id,
        action: 'create',
        entity: 'file',
        entityId: newFile._id,
        newValue: newFile,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      });

      res.status(201).json({ message: 'File uploaded successfully', file: newFile });
    } catch (error) {
      console.log('Error uploading file:', error);
      res.status(500).json({ message: 'Error uploading file', error: error.message });
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

      // Create an audit log entry for the update action
      await AuditLog.create({
        userId: req.user._id,
        action: 'update',
        entity: 'file',
        entityId: file._id,
        oldValue: { ...file._doc }, // Store old values
        newValue: file,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      });

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

      const params = {
        Bucket: process.env.S3_BUCKET_NAME_FILE_STORAGE,
        Key: `files/${file.originalName}`,
      };

      await s3.deleteObject(params).promise();
      await file.deleteOne();

      // Create an audit log entry for the delete action
      await AuditLog.create({
        userId: req.user._id,
        action: 'delete',
        entity: 'file',
        entityId: file._id,
        oldValue: file,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      });

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

      // Create an audit log entry for the restore action
      await AuditLog.create({
        userId: req.user._id,
        action: 'access',
        entity: 'file',
        entityId: file._id,
        oldValue: { isDeleted: true },
        newValue: { isDeleted: false },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      });

      res.status(200).json({ message: 'File restored successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Error restoring file', error: error.message });
    }
  },

  getAllFiles: async (req, res) => {
    try {
      const files = await File.find({ isDeleted: false, ownerId: req.user._id })
        .populate('folderId')
        .populate({
          path: "ownerId",
          select: "name"
        });

      // Create an audit log entry for retrieving files
      await AuditLog.create({
        userId: req.user._id,
        action: 'view',
        entity: 'file',
        entityId: null, // No specific entity ID for this action
        newValue: files,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      });

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

      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path); // Delete the local file
      } else {
        console.log(`Local file ${file.path} not found`);
      }

      const params = {
        Bucket: process.env.S3_BUCKET_NAME_FILE_STORAGE,
        Key: `files/${file.originalName}`,
      };

      const s3Response = await s3.deleteObject(params).promise();

      // Create an audit log entry for the permanent deletion
      await AuditLog.create({
        userId: req.user._id,
        action: 'delete',
        entity: 'file',
        entityId: file._id,
        oldValue: file,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      });

      return res.status(200).json({ message: 'File permanently deleted', response: s3Response });
    } catch (error) {
      console.error('Error permanently deleting file:', error);
      return res.status(500).json({ message: 'Error permanently deleting file', error: error.message });
    }
  },

  createFolder: async (req, res) => {
    try {
      const ownerId = req.user._id;
      const { name, parentId } = req.body;

      if (!name || !ownerId) {
        return res.status(400).json({ message: 'Folder name and owner ID are required' });
      }

      const existingFolder = await Folder.findOne({ name, ownerId, parentId });
      if (existingFolder) {
        return res.status(409).json({ message: 'Folder with this name already exists' });
      }

      const newFolder = new Folder({
        name,
        user: ownerId,
        parentId: parentId ? parentId : null,
      });

      await newFolder.save();

      // Create an audit log entry for the folder creation
      await AuditLog.create({
        userId: req.user._id,
        action: 'create',
        entity: 'Folder',
        entityId: newFolder._id,
        newValue: newFolder,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      });

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

      if (!searchTerm) {
        return res.status(400).json({ message: 'Search term is required' });
      }

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

      // Create an audit log entry for the search action
      await AuditLog.create({
        userId: req.user._id,
        action: 'access',
        entity: 'User',
        entityId: null, // No specific entity ID for this action
        newValue: invitations,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      });

      res.status(200).json(invitations);
    } catch (error) {
      res.status(500).json({ message: 'Error searching invitations', error: error.message });
    }
  }
};
