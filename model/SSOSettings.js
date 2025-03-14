// models/SSOSettings.js
const mongoose = require('mongoose');

const SSOSettingsSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  provider: {
    type: String,
    required: true,
    enum: ['google', 'facebook', 'azure-ad', 'saml', 'oauth2', 'openid-connect'],
    description: "Indicates the SSO provider (e.g., 'google', 'facebook', 'azure-ad')"
  },
  loginUrl: { type: String, required: false },  // Some providers may not need a login URL
  redirectUrl: { type: String, required: true },
  clientId: { type: String, required: true },
  clientSecret: { type: String, required: true },  // Rename "secret" to "clientSecret" for clarity
  tenantId: { type: String, required: false },     // Required only for Azure AD
  secretExpiry: { type: Date, required: false },   // Optional, for rotating secrets
  scopes: { type: [String], required: false },     // Scopes for OAuth-based providers like Google and Facebook
  additionalSettings: { type: Map, of: String }    // Allows custom settings for other providers
}, { timestamps: true, toJSON: { getters: true } });

module.exports = mongoose.model('SSOSettings', SSOSettingsSchema);
