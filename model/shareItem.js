const mongoose = require('mongoose');

const SharedItemSchema = new mongoose.Schema({
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  itemType: { type: String, required: true },
  itemId: { type: mongoose.Schema.Types.ObjectId, required: true },
  sharedWith: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    permissions: {
      view: { type: Boolean, default: false },
      edit: { type: Boolean, default: false },
      delete: { type: Boolean, default: false }
    }
  }],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('SharedItem', SharedItemSchema);
