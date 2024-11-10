const Folder = require("../model/folder");

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
    res.status(201).json(folder);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

// Get all folders for the logged-in user
exports.getUserFolders = async (req, res) => {
  try {
    const folders = await Folder.findByUser(req.user.id);
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
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

// Get folders by type
exports.getFoldersByType = async (req, res) => {
  const { type } = req.params;

  try {
    // Find folders by type and user
    const folders = (await Folder.find({ user: req.user._id, type })).map(
      (folder) => {
        return {
          _id: folder._id,
          label: folder.name,
        };
      }
    );

    if (folders.length === 0) {
      return res
        .status(404)
        .json({ message: "No folders found for this type" });
    }

    res.status(200).json(folders);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};
