const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    content: {
        type: String,
        required: true,
        trim: true
    },
    tags: [{
        type: String,
        trim: true
    }],
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date
    }
});

noteSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

const note = mongoose.model('Note', noteSchema);

module.exports = note;
