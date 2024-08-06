const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const securityQuestionSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: 'User'  // Reference to a User model
  },
  securityQuestions: [{
    question: {
      type: String,
      required: true,
      trim: true,
      minlength: 10,  // Minimum length for a security question
      maxlength: 255  // Maximum length for a security question
    },
    answer: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,  // Minimum length for the answer
      maxlength: 255  // Maximum length for the answer
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Automatically update the `updatedAt` field when the document is updated
securityQuestionSchema.pre('save', function(next) {
  if (this.isModified()) {
    this.updatedAt = Date.now();
  }
  next();
});

const SecurityQuestion = mongoose.model('SecurityQuestion', securityQuestionSchema);

module.exports = SecurityQuestion;
