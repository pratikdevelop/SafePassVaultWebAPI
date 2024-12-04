const Tag = require("../model/tag");
const AuditLog = require('../model/Auditlogs'); // Import the Audit Log model

// Create a new tag
exports.createTag = async (req, res) => {
  try {
    const tag = new Tag(req.body);
    await tag.save();

    // Create an audit log entry for the tag creation
    await AuditLog.create({
      userId: req.user._id,
      action: 'create',
      entity: 'Tag',
      entityId: tag._id,
      newValue: tag,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.status(201).json(tag);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Get all tags
exports.getAllTagsByType = async (req, res) => {
  try {
    const tags = (await Tag.find({
      tagType: req.params.type,
    })).map((tag) => {
      return {
        _id: tag._id,
        label: tag.name,
      };
    });

    // Create an audit log entry for retrieving tags
    await AuditLog.create({
      userId: req.user._id,
      action: 'view',
      entity: 'Tag',
      entityId: null, // No specific entity ID for this action
      newValue: tags,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.status(200).json({ tags });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get a specific tag
exports.getTagById = async (req, res) => {
  try {
    const tag = await Tag.findById(req.params.id);
    if (!tag) {
      return res.status(404).json({ error: "Tag not found" });
    }

    // Create an audit log entry for retrieving a specific tag
    await AuditLog.create({
      userId: req.user._id,
      action: 'view',
      entity: 'Tag',
      entityId: tag._id,
      newValue: tag,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.json(tag);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update a tag
exports.updateTag = async (req, res) => {
  try {
    const tag = await Tag.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!tag) {
      return res.status(404).json({ error: "Tag not found" });
    }

    // Create an audit log entry for the tag update
    await AuditLog.create({
      userId: req.user._id,
      action: 'update',
      entity: 'Tag',
      entityId: tag._id,
      oldValue: { ...tag._doc }, // Store old values
      newValue: tag,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.json(tag);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Delete a tag
exports.deleteTag = async (req, res) => {
  try {
    const tag = await Tag.findByIdAndDelete(req.params.id);
    if (!tag) {
      return res.status(404).json({ error: "Tag not found" });
    }

    // Create an audit log entry for the tag deletion
    await AuditLog.create({
      userId: req.user._id,
      action: 'delete',
      entity: 'Tag',
      entityId: tag._id,
      oldValue: tag,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.json({ message: "Tag deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Search for tags by name
exports.searchTagsByName = async (req, res) => {
  try {
    const { name, type } = req.params;
    const tags = await Tag.find({
      name: { $regex: new RegExp(name, "i") },
      type,
      created_by: req.user._id
    });

    // Create an audit log entry for the search action
    await AuditLog.create({
      userId: req.user._id,
      action: 'search',
      entity: 'Tag',
      entityId: null, // No specific entity ID for this action
      newValue: tags,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.json(tags);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
