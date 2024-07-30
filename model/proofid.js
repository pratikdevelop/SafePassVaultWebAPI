const mongoose = require('mongoose');

const proofIdSchema = new mongoose.Schema({
    idType: {
        type: String,
        required: true,
        trim: true
    },
    idNumber: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    issuedBy: {
        type: String,
        required: true,
        trim: true
    },
    issueDate: {
        type: Date,
        required: true
    },
    expiryDate: {
        type: Date
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date
    }
});

proofIdSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

const ProofId = mongoose.model('ProofId', proofIdSchema);

module.exports = ProofId;
