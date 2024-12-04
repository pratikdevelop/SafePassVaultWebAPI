const Folder = require("../model/folder");
const AuditLog = require('../model/Auditlogs'); // Import the Audit Log model

// Create a new folder
exports.createFolder = async (req, res) => {
  try {
    const { name, isSpecial, type } = req.body;
    const folder = new Folder({
      user: req.user._id, // Get user ID from the auth middleware
      name,
      isSpecial,
      type,
    });
    await folder.save();

    // Create an audit log entry for the folder creation
    await AuditLog.create({
      userId: req.user._id,
      action: 'create',
      entity: 'Folder',
      entityId: folder._id,
      newValue: folder,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.status(201).json(folder);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

// Get all folders for the logged-in user
exports.getUserFolders = async (req, res) => {
  try {
    const folders = await Folder.findByUser(req.user.id);

    // Create an audit log entry for retrieving folders
    await AuditLog.create({
      userId: req.user._id,
      action: 'view',
      entity: 'Folder',
      entityId: null, // No specific entity ID for this action
      newValue: folders,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.status(200).json(folders);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

// Get a specific folder by ID
exports.getFolderById = async (req, res) => {
  try {
    const folder = await Folder.findById(req.params.id);
    if (!folder) {
      return res.status(404).json({ message: "Folder not found" });
    }
    if (folder.user.toString() !== req.user.id) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    // Create an audit log entry for retrieving a specific folder
    await AuditLog.create({
      userId: req.user._id,
      action: 'view',
      entity: 'Folder',
      entityId: folder._id,
      newValue: folder,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.status(200).json(folder);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

// Update a folder
exports.updateFolder = async (req, res) => {
  try {
    const { name, isSpecial, type } = req.body;
    const folder = await Folder.findById(req.params.id);

    if (!folder) {
      return res.status(404).json({ message: "Folder not found" });
    }
    if (folder.user.toString() !== req.user.id) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    folder.name = name || folder.name;
    folder.isSpecial = isSpecial !== undefined ? isSpecial : folder.isSpecial;
    folder.type = type || folder.type;

    await folder.save();

    // Create an audit log entry for the folder update
    await AuditLog.create({
      userId: req.user._id,
      action: 'update',
      entity: 'Folder',
      entityId: folder._id,
      oldValue: { ...folder._doc }, // Store old values
      newValue: folder,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.status(200).json(folder);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

// Delete a folder
exports.deleteFolder = async (req, res) => {
  try {
    const folder = await Folder.findById(req.params.id);
    if (!folder) {
      return res.status(404).json({ message: "Folder not found" });
    }
    if (folder.user.toString() !== req.user.id) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    await folder.remove();

    // Create an audit log entry for the folder deletion
    await AuditLog.create({
      userId: req.user._id,
      action: 'delete',
      entity: 'Folder',
      entityId: folder._id,
      oldValue: folder,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

// Get folders by type
exports.getFoldersByType = async (req, res) => {
  const { type } = req.params;

  try {
    const folders = (await Folder.find({ user: req.user._id, type })).map(
      (folder) => {
        return {
          _id: folder._id,
          label: folder.name,
        };
      }
    );

    if (folders.length === 0) {
      return res.status(404).json({ message: "No folders found for this type" });
    }

    // Create an audit log entry for retrieving folders by type
    await AuditLog.create({
      userId: req.user._id,
      action: 'view',
      entity: 'Folder',
      entityId: null, // No specific entity ID for this action
      newValue: folders,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.status(200).json(folders);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

// Search folders
exports.searchFolders = async (req, res) => {
  try {
    const ownerId = req.user._id;
    const { searchTerm, type } = req.query;

    if (!searchTerm || !ownerId) {
      return res.status(400).json({ message: 'Search term and owner ID are required' });
    }

    const folders = (await Folder.find({
      name: { $regex: new RegExp(searchTerm, 'i') },
      type: type,
      user: ownerId
    })).map(
      (folder) => {
        return {
          _id: folder._id,
          label: folder.name,
        };
      }
    );

    // Create an audit log entry for the search action
    await AuditLog.create({
      userId: req.user._id,
      action: 'access',
      entity: 'Folder',
      entityId: null, // No specific entity ID for this action
      newValue: folders,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.status(200).json(folders);
  } catch (error) {
    console.log('Error searching folders:', error);
    res.status(500).json({ message: 'Error searching folders', error: error.message });
  }
};
