const mongoose = require("mongoose");

const commentSchema = new mongoose.Schema({
    content: {
      type: String,
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  });

  
const Comment = mongoose.model('Comment', commentSchema);

module.exports = Comment;

  