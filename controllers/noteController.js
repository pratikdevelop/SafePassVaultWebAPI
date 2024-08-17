const Note = require('../model/note'); // Assuming the schema file is named note.js
const User = require('../model/user');

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
    let notes = await Note.find({});

    let updatedNotes = await Promise.all(notes.map(async (note) => {
      const user = await User.findById(note.userId);
      note = note.toObject();
      note.ownerName = user ? user.name : 'Unknown';
      return note;
    }));

    res.send(updatedNotes);
  } catch (error) {
    console.error("Error retrieving notes:", error);
    res.status(500).send(error);
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
    const note = await Note.findByIdAndDelete(req.params.id);
    if (!note) {
      return res.status(404).send();
    }
    res.send(note);
  } catch (error) {
    console.error("Error deleting note:", error);
    res.status(500).send(error);
  }
};
