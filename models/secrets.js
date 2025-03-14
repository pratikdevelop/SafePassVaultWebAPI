// models/Secret.js

const mongoose = require('mongoose');
const crypto = require('crypto');

// Define the Secret schema
const secretSchema = new mongoose.Schema({
    name: { type: String, required: true },
    value: { type: String, required: true },  // This will store the encrypted data
    type: { type: String, required: true },   // e.g. 'api_key', 'credential', 'env_var'
    description: { type: String, default: '' },
    createdAt: { type: Date, default: Date.now }
});

// Encrypt the data before saving to the database
secretSchema.pre('save', function (next) {
    if (this.isModified('value')) {
        this.value = encrypt(this.value);
    }
    next();
});

// Helper function for encryption
function encrypt(text) {
    const cipher = crypto.createCipher('aes-256-cbc', process.env.SECRET_KEY);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
}

// Helper function for decryption
function decrypt(encryptedText) {
    const decipher = crypto.createDecipher('aes-256-cbc', process.env.SECRET_KEY);
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
}

// Create a method to get decrypted data
secretSchema.methods.getDecryptedValue = function () {
    return decrypt(this.value);
};

const Secret = mongoose.model('Secret', secretSchema);

module.exports = Secret;
