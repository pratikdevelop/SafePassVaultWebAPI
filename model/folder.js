const mongoose = require('mongoose');

const folderSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    name: {
        type: String,
        required: true
    },
    parentFolder: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Folder',
        default: null
    },
    createdAt: {
        type: Date,
        default: Date.now, // Set the default value to the current timestamp
    },
    updatedAt: {
        type: Date,
        default: Date.now, // Set the default value to the current timestamp
    },
});


const Folder = mongoose.model('Folder', folderSchema);

module.exports = Folder;


