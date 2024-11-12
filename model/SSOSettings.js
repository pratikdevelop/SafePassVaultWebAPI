// models/SSOSettings.js
const mongoose = require('mongoose');

const SSOSettingsSchema = new mongoose.Schema({
  loginUrl: { type: String, required: true },
  redirectUrl: { type: String, required: true },
  clientId: { type: String, required: true },
  tenantId: { type: String, required: true },
  secret: { type: String, required: true },
  secretExpiry: { type: Date, required: true }
}, { timestamps: true });

module.exports = mongoose.model('SSOSettings', SSOSettingsSchema);
