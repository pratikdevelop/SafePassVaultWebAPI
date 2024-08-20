const mongoose = require('mongoose');

const folderSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    name: {
        type: String,
        required: true,
        trim: true // Trim whitespace around folder names
    }
}, {
    timestamps: true // Automatically manage createdAt and updatedAt
});

// Index for faster searching
folderSchema.index({ name: 1, user: 1 });

const Folder = mongoose.model('Folder', folderSchema);

module.exports = Folder;
