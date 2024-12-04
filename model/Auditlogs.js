const mongoose = require('mongoose');

// Schema for Detailed Audit Log Entry
const AuditLogSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    action: {
        type: String,
        enum: ['create', 'update', 'delete', 'view', 'share', 'access'],
        required: true
    },
    entity: {
        type: String,
        required: true
    },
    entityId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    oldValue: {
        type: mongoose.Schema.Types.Mixed, // Stores old values for updates
    },
    newValue: {
        type: mongoose.Schema.Types.Mixed, // Stores new values for updates
    },
    ipAddress: {
        type: String
    },
    userAgent: {
        type: String
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Create the model
const AuditLogs = mongoose.model('AuditLogs', AuditLogSchema);

module.exports = AuditLogs;