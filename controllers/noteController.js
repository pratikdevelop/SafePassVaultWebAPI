const Note = require("../models/note"); // Assuming the schema file is named note.js
const User = require("../models/user");
const { parse } = require("json2csv");
const SharedItem = require("../models/shareItem"); // Assuming this is your SharedItem model
const Tag = require("../models/tag");
const Comment = require("../models/comment");
const AuditLog = require('../models/Auditlogs'); // Import the Audit Log model

// Create a new note
exports.createNote = async (req, res) => {
  try {
    req.body.userId = req.user._id;
    req.body.modifiedby = req.user._id;
    const { folderId } = req.body;
    if (!folderId) {
      return res.status(400).json({
        message: "Folder ID is required to create a new note",
      });
    } else {
      req.body["folder"] = folderId; // Set folder ID
    }
    const newNote = new Note(req.body);
    await newNote.save();

    // Create an audit log entry for the note creation
    await AuditLog.create({
      userId: req.user._id,
      action: 'create',
      entity: 'notes',
      entityId: newNote._id,
      newValue: newNote,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.status(201).send(newNote);
  } catch (error) {
    res.status(400).send(error);
  }
};

// Get all notes
exports.getAllNotes = async (req, res) => {
  try {
    const userId = req.user._id;
    const {
      page = 1,
      limit = 10,
      sort = "title",
      order = "asc",
      search,
      folderId,
      filter = "all",
    } = req.query;

    const user = await User.findById(userId);

    // Set sort option
    const sortOption = { [sort]: order === "asc" ? 1 : -1 };

    // Build the search query
    const searchQuery =
      search && search !== "undefined"
        ? {
          $or: [
            { title: { $regex: search, $options: "i" } },
            { content: { $regex: search, $options: "i" } },
            { description: { $regex: search, $options: "i" } },
          ],
        }
        : {};

    // Initialize the main query object
    const query = { userId, ...searchQuery };
    if (folderId) query.folder = folderId;

    // Apply filter-specific logic
    let sharedItems = [];
    switch (filter) {
      case "favourite":
        query._id = { $in: user.favorites };
        break;

      case "shared_with_me":
        sharedItems = await SharedItem.find({
          itemType: "note",
          "sharedWith.userId": userId,
        }).populate("itemId");

        const sharedNoteIds = sharedItems.map((item) => item.itemId);
        query._id = { $in: sharedNoteIds };
        break;

      case "created_by_me":
        query.userId = userId;
        break;

      case "all":
      default:
        sharedItems = await SharedItem.find({
          itemType: "note",
          "sharedWith.userId": userId,
        }).populate("itemId");

        const allSharedNoteIds = sharedItems.map((item) => item.itemId);
        query.$or = [{ userId }];
        if (allSharedNoteIds.length > 0) {
          query.$or.push({ _id: { $in: allSharedNoteIds } });
        }
        break;
    }

    // Execute the query
    const notes = await Note.find(query)
      .populate("tags")
      .populate({
        path: "comments",
        populate: { path: "createdBy", select: "name" },
      })
      .populate({ path: "userId", select: "name" })
      .populate({ path: "modifiedby", select: "name" })
      .sort(sortOption)
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .lean(); // Converts Mongoose documents to plain JavaScript objects

    // Enhance notes with favorites and shared item info
    const enhancedNotes = notes.map((note) => {
      const isFavorite = user.favorites.includes(note._id);
      const sharedItem = sharedItems.find(
        (item) => item.itemId.toString() === note._id.toString()
      );

      return {
        ...note,
        modifiedby: !note.modifiedby ? note.userId : note.modifiedby,
        isFavorite,
        sharedItem: sharedItem
          ? sharedItem.sharedWith.find(
            (sw) => sw.userId.toString() === userId.toString()
          )
          : null,
      };
    });

    // Fetch total count for pagination
    const totalCount = await Note.countDocuments(query);

    // Create an audit log entry for retrieving notes
    await AuditLog.create({
      userId: req.user._id,
      action: 'view',
      entity: 'notes',
      newValue: enhancedNotes,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.json({
      data: enhancedNotes,
      pagination: {
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        currentPage: Number(page),
        pageSize: Number(limit),
      },
    });
  } catch (error) {
    console.error(
      `Error fetching notes for user ${req.user._id}: ${error.message
        .replace(/"/g, '')}`
    );

    res.status(500).json({ message: "Error fetching notes" });
  }
};

// Get a note by ID
exports.getNoteById = async (req, res) => {
  const _id = req.params.id;
  try {
    const note = await Note.findById(_id);
    if (!note) {
      return res.status(404).send();
    }

    // Create an audit log entry for retrieving a specific note
    await AuditLog.create({
      userId: req.user._id,
      action: 'view',
      entity: 'notes',
      entityId: note._id,
      newValue: note,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.send(note);
  } catch (error) {
    res.status(500).send(error);
  }
};

// Update a note by ID
exports.updateNote = async (req, res) => {
  const updates = Object.keys(req.body);
  const allowedUpdates = ["title", "content", "tags", "userId"];
  const isValidOperation = updates.every((update) =>
    allowedUpdates.includes(update)
  );

  if (!isValidOperation) {
    return res.status(400).send({ error: "Invalid updates!" });
  }

  try {
    const note = await Note.findById(req.params.id);
    if (!note) {
      return res.status(404).send({ error: "Note not found!" });
    }

    updates.forEach((update) => (note[update] = req.body[update]));

    if (updates.includes("userId")) {
      const user = await User.findById(note.userId);
      note.ownerName = user ? user.name : "Unknown";
    }
    note.modifiedby = req.user._id;

    await note.save();

    // Create an audit log entry for the note update
    await AuditLog.create({
      userId: req.user._id,
      action: 'update',
      entity: 'notes',
      entityId: note._id,
      oldValue: { ...note._doc }, // Store old values
      newValue: note,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.send(note);
  } catch (error) {
    res.status(400).send({ error: "Error updating note!" });
  }
};

// Delete a note by ID
exports.deleteNote = async (req, res) => {
  try {
    const notesIds = req.params.id.split(",");
    const note = await Note.deleteMany({ _id: { $in: notesIds } });
    if (!note) {
      return res.status(404).send();
    }

    // Create an audit log entry for the note deletion
    await AuditLog.create({
      userId: req.user._id,
      action: 'delete',
      entity: 'notes',
      entityId: notesIds, // Log the IDs of deleted notes
      oldValue: notesIds,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.send(note);
  } catch (error) {
    res.status(500).send(error);
  }
};

exports.toggleFavorite = async (req, res) => {
  try {
    const userId = req.user._id;
    const notesIds = req.params.noteId.split(",");

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    for (const id of notesIds) {
      const note = await Note.findById(id);
      if (!note) {
        return res
          .status(404)
          .json({ message: `Note with ID ${id} not found` });
      }

      const favoriteIndex = user.favorites.indexOf(id);
      if (favoriteIndex > -1) {
        user.favorites.splice(favoriteIndex, 1);
      } else {
        user.favorites.push(id);
      }
    }

    await user.save();

    // Create an audit log entry for toggling favorites
    await AuditLog.create({
      userId: req.user._id,
      action: 'update',
      entity: 'User',
      entityId: userId,
      oldValue: { favorites: user.favorites }, // Store old values
      newValue: { favorites: user.favorites },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    return res.status(200).json({ message: "Favorites updated successfully" });
  } catch (err) {
    res.status(500).json({ message: "Error updating favorites" });
  }
};

exports.exportAllNotesAsCsv = async (req, res) => {
  try {
    const exportNotesIDs = req.query.ids.split(",");
    const userId = req.user._id;
    const notes = await Note.find({
      userId: userId,
      _id: { $in: exportNotesIDs },
    })
      .populate("tags")
      .lean(); // Convert to plain JSON
    const csv = parse(notes);

    // Create an audit log entry for exporting notes
    await AuditLog.create({
      userId: req.user._id,
      action: 'export',
      entity: 'notes',
      entityId: null, // No specific entity ID for this action
      newValue: notes,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    // Set headers for CSV download
    res.header("Content-Type", "text/csv");
    res.header("Content-Disposition", "attachment; filename=notes.csv");
    res.send(csv);
  } catch (error) {
    res.status(500).send(error);
  }
};

exports.addTag = async (req, res) => {
  const { tagName, noteId } = req.body;

  try {
    let tag = await Tag.findOne({ name: tagName });

    if (!tag) {
      tag = new Tag({ name: tagName });
      await tag.save();
    }

    const note = await Note.findById(noteId);

    if (!note) {
      logger.warn("Note not found for adding tag", { noteId });
      return res.status(404).json({ error: "Note not found" });
    }

    if (!note.tags) {
      note.tags = [];
    }

    if (!note.tags.includes(tag._id)) {
      note.tags.push(tag._id);
      note.modifiedby = req.user._id;

      await note.save();
      logger.info("Tag added to note successfully", { tag, noteId });
    }

    res.json({
      message: "Tag added to note successfully",
      tag,
      note,
      userId: req.user._id,
    });
  } catch (error) {
    logger.error("Error adding tag", {
      error: error.message,
      userId: req.user._id,
    });
    res.status(500).json({ error: "An error occurred while adding the tag" });
  }
};

exports.postComment = async (req, res) => {
  try {
    const { noteId } = req.params;
    const createdBy = req.user._id; // Assuming req.user contains the authenticated user's info
    const { content } = req.body;

    // Create a new comment
    const newComment = new Comment({
      content,
      createdBy,
    });

    // Save the comment to the database
    await newComment.save();

    // Find the associated note
    const note = await Note.findById(noteId);
    if (!note) {
      logger.warn("Note not found for comment", { noteId });
      return res.status(404).json({ message: "Note not found" });
    }

    // Add the new comment ID to the note's comments array
    note.comments.push(newComment._id);
    note.modifiedby = req.user._id;
    await note.save();

    // Retrieve the user's name by ID
    const userName = await getUserNameById(createdBy); // Assuming you have the function defined

    // Respond with the newly created comment, including the user name
    logger.info("Comment added successfully", {
      noteId,
      commentId: newComment._id,
      userId: req.user._id,
    });
    res.status(201).json({
      message: "Comment added successfully",
      comment: { ...newComment.toObject(), userName },
    });
  } catch (error) {
    logger.error("Error posting comment", {
      error: error.message,
      userId: req.user._id,
    });
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Function to get the user's name by ID
const getUserNameById = async (userId) => {
  try {
    const user = await User.findById(userId).select("name"); // Adjust the field as needed
    return user ? user.name : null; // Return user name or null if not found
  } catch (error) {
    throw error; // Handle error appropriately
  }
};
