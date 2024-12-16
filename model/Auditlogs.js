const mongoose = require('mongoose');

// Define the schema for the Audit Log Entry
const AuditLogSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    action: {
        type: String,
        required: true
    },
    entity: {
        type: String,
        required: true
    },
    entityId: {
        type: mongoose.Schema.Types.ObjectId,
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

// Method to populate the entity dynamically
AuditLogSchema.methods.populateEntity = async function () {
    const entityModel = this.entity.charAt(0) + this.entity.slice(1); // Capitalize first letter (e.g., passwords -> Passwords)
    try {
        const model = mongoose.model(entityModel);
        const entityData = await model.findById(this.entityId);
        this.entityData = entityData; // Adding dynamic reference to the log object
    } catch (err) {
        console.error('Error populating entity:', err);
    }
};

// Create the model for AuditLogs
const AuditLogs = mongoose.model('AuditLogs', AuditLogSchema);

module.exports = AuditLogs;
