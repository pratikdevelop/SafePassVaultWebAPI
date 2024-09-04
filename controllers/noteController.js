const Note = require('../model/note'); // Assuming the schema file is named note.js
const User = require('../model/user');
const { parse } = require('json2csv');
const SharedItem = require('../model/shareItem'); // Assuming this is your SharedItem model

// Create a new note
exports.createNote = async (req, res) => {
  try {
    req.body.userId = req.user._id;
    const newNote = new Note(req.body);
    await newNote.save();
    res.status(201).send(newNote);
  } catch (error) {
    console.error("Error creating note:", error);
    res.status(400).send(error);
  }
};

// Get all notes
exports.getAllNotes = async (req, res) => {
  try {
    const userId = req.user._id;
    const { page = 1, limit = 10, sort = 'title', order = 'asc', search } = req.query;

    // Prepare sorting and search options
    const sortOption = {};
    sortOption[sort] = order === 'asc' ? 1 : -1;

    const searchQuery = search !== 'undefined'
      ? {
          $or: [
            { title: { $regex: search, $options: 'i' } },
            { content: { $regex: search, $options: 'i' } },
            { description: { $regex: search, $options: 'i' } }
          ]
        }
      : {};

    // Find notes created by the user
    const createdNotes = await Note.find({ userId: userId, ...searchQuery })
      .sort(sortOption)
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .lean();  // Converts Mongoose documents to plain JavaScript objects

    // Find notes shared with the user
    const sharedItems = await SharedItem.find({ 
      itemType: 'note', 
      'sharedWith.userId': userId 
    }).populate('itemId');

    const sharedNoteIds = sharedItems.map(item => item.itemId);

    // Find and populate shared notes
    const sharedNotes = await Note.find({ 
      _id: { $in: sharedNoteIds }, 
      ...searchQuery 
    })
    .sort(sortOption)
    .lean();

    // Combine created and shared notes
    const allNotes = [...createdNotes, ...sharedNotes];

    // Enhance notes with ownership and shared item data
    const user = await User.findById(userId);
    const enhancedNotes = allNotes.map(note => {
      const isFavorite = user.favorites.includes(note._id);
      const sharedItem = sharedItems.find(item => item.itemId.toString() === note._id.toString());

      return {
        ...note,
        ownerName: note.userId.toString() === userId.toString() ? user.name : 'Unknown',
        isFavorite,
        sharedItem: sharedItem ? 
           sharedItem.sharedWith.find(sw => sw.userId.toString() === userId.toString()) : null
      };
    });

    const totalCount = createdNotes.length + sharedNotes.length;

    res.json({
      data: enhancedNotes,
      pagination: {
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        currentPage: Number(page),
        pageSize: Number(limit)
      }
    });
  } catch (error) {
    console.error("Error retrieving notes:", error);
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
    res.send(note);
  } catch (error) {
    console.error("Error retrieving note:", error);
    res.status(500).send(error);
  }
};

// Update a note by ID
exports.updateNote = async (req, res) => {
  const updates = Object.keys(req.body);
  const allowedUpdates = ['title', 'content', 'tags', 'userId'];
  const isValidOperation = updates.every((update) => allowedUpdates.includes(update));

  if (!isValidOperation) {
    return res.status(400).send({ error: 'Invalid updates!' });
  }

  try {
    const note = await Note.findById(req.params.id);
    if (!note) {
      return res.status(404).send({ error: 'Note not found!' });
    }

    updates.forEach((update) => note[update] = req.body[update]);

    if (updates.includes('userId')) {
      const user = await User.findById(note.userId);
      note.ownerName = user ? user.name : 'Unknown';
    }

    await note.save();
    res.send(note);
  } catch (error) {
    console.error("Error updating note:", error);
    res.status(400).send({ error: 'Error updating note!' });
  }
};

// Delete a note by ID
exports.deleteNote = async (req, res) => {
  try {
    const notesIds = req.params.id.split(',');
    const note = await Note.deleteMany({ _id: { $in: notesIds } });
    if (!note) {
      return res.status(404).send();
    }
    res.send(note);
  } catch (error) {
    console.error("Error deleting note:", error);
    res.status(500).send(error);
  }
};

exports.toggleFavorite = async (req, res) => {
  try {
    const userId = req.user._id;
    const notesIds = req.params.noteId.split(',');
  
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
  
    for (const id of notesIds) {
      const note = await Note.findById(id);
      if (!note) {
        return res.status(404).json({ message: `Note with ID ${id} not found` });
      }
  
      const favoriteIndex = user.favorites.indexOf(id);
      if (favoriteIndex > -1) {
        user.favorites.splice(favoriteIndex, 1);
      } else {
        user.favorites.push(id);
      }
    }
  
    await user.save();
    return res.status(200).json({ message: 'Favorites updated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error updating favorites' });
  }
};

exports.exportAllNotesAsCsv = async(req, res) => {
    try {
      const exportNotesIDs = req.query.ids.split(",")
      const userId = req.user._id;
      const notes = await Note.find({userId: userId,  _id: { $in: exportNotesIDs },}).populate('tags').lean() // Convert to plain JSON
      const csv = parse(notes);
      
      // Set headers for CSV download
      res.header('Content-Type', 'text/csv');
      res.header('Content-Disposition', 'attachment; filename=passwords.csv');
      res.send(csv);
    } catch (error) {
      console.error(error);
      res.status(500).send(error);
    }
}