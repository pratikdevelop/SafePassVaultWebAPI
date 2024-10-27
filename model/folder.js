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
    },
    isSpecial: { // Example field if needed
        type: Boolean,
        default: false
    },
    type: { // New field for folder type
        type: String,
        required: true,
        enum: ['passwords', 'notes', 'cards', 'proof', 'files'], // Add the types you want to support
        default: 'passwords' // Default type, can be changed as needed
    }
}, {
    timestamps: true // Automatically manage createdAt and updatedAt
});

// Index for faster searching
folderSchema.index({ name: 1, user: 1 });

const Folder = mongoose.model('Folder', folderSchema);

module.exports = Folder;
