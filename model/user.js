const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const speakeasy = require("speakeasy"); // For TOTP generation
const crypto = require("crypto"); // For random generation
const bip39 = require("bip39"); // For recovery phrase (mnemonic) generation

// Main User Schema
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    match: /.+\@.+\..+/,
  },
  phone: {
    type: Number,
    required: true,
    match: /^[0-9]{10}$/,
  },
  userImage: {
    type: String, // Stores the path or URL of the uploaded image
  },
  totpQrImage: {
    type: String,
  },
  password: {
    type: String,
  },
  passphrase: {
    type: String,
  },
  emailConfirmed: {
    type: Boolean,
    default: false,
  },
  confirmationCode: {
    type: String,
  },
  tokens: [
    {
      token: {
        type: String,
        required: true,
      },
      expiry: {
        type: Date,
      },
    },
  ],
  resetToken: {
    type: String,
  },
  resetTokenExpiry: {
    type: Date,
  },
  // MFA Fields
  mfaEnabled: {
    type: Boolean,
    default: false,
  },
  mfaMethod: {
    type: String,
    enum: ["email", "sms", "totp"],
    default: "email",
  },
  totpSecret: {
    type: String,
  },
  billingAddress: { type: String },
  city: { type: String },
  state: { type: String },
  postalCode: { type: String },
  organization: [{ type: mongoose.Schema.Types.ObjectId, ref: "Organization" }],
  invitation: [{ type: mongoose.Schema.Types.ObjectId, ref: "Invitation" }],
  country: { type: String },
  favorites: [{ type: mongoose.Schema.Types.ObjectId, ref: "Password" }],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  role: {
    type: String,
    enum: ["admin", "user"],
    default: "admin",
  },
  // New Fields for Private Key Authentication
  publicKey: {
    type: String,
    required: true, // The public key for authentication
  },
  privateKey: {
    type: String,
    required: true
  },
  recoveryPhrase: {
    type: String,
    required: true, // Store the recovery phrase (in plain text or encrypted)
  },
  fingerPrint: {
    type: String,
    required: true, // Store the fingerprint of the user's device
  },

});

// Password hashing middleware
userSchema.pre("save", async function (next) {
  if (!this.isModified("password") && !this.isModified("passphrase")) {
    return next();
  }

  // Hash password or passphrase if modified
  if (this.isModified("password")) {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
  }

  if (this.isModified("passphrase")) {
    const salt = await bcrypt.genSalt(12);
    this.passphrase = await bcrypt.hash(this.passphrase, salt);
  }

  next();
});


const generateEncryptionKey = async () => {
  return await crypto.subtle.generateKey(
    {
      name: "AES-GCM", // Using AES-GCM encryption algorithm
      length: 256, // 256-bit key length
    },
    true, // The key is extractable, so we can use it for encryption/decryption
    ["encrypt", "decrypt"] // The key can be used for encryption and decryption
  );
}
// Generate auth token
userSchema.methods.generateAuthToken = function () {
  const token = jwt.sign({ _id: this._id }, process.env.SECRET_KEY);
  // const token = jwt.sign({ _id }, process.env.SECRET_KEY);
  this.tokens = [{ token }];
  this.save();
  return token;
};

// Find user by credentials
userSchema.statics.findByCredentials = async function (email, password) {
  const user = await this.findOne({ email });
  if (!user) {
    throw new Error("Invalid email");
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new Error("Invalid password");
  }
  return user;
};

// Verify reset token
userSchema.methods.verifyResetToken = function (token, user) {
  const isMatch = user && user.resetToken === token;
  const isExpired =
    user.resetTokenExpiry && new Date(user.resetTokenExpiry) < new Date();
  return isMatch && !isExpired;
};

// TOTP Methods
userSchema.methods.generateTotpSecret = function () {
  const secret = speakeasy.generateSecret();
  this.totpSecret = secret.base32; // Save base32 secret for TOTP verification
  return secret;
};

userSchema.methods.verifyTotpCode = function (token) {
  return speakeasy.totp.verify({
    secret: this.totpSecret,
    encoding: "base32",
    token,
  });
};

// Method to generate recovery phrase (mnemonic)
userSchema.methods.encryptRecoveryPhrase = function () {
  const cipher = crypto.createCipher('aes-256-cbc', encryptionKey);
  let encrypted = cipher.update(this.recoveryPhrase, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  this.recoveryPhrase = encrypted; // Store the encrypted recovery phrase
};

// Decrypt the recovery phrase when retrieving it
userSchema.methods.decryptRecoveryPhrase = function () {
  const decipher = crypto.createDecipher('aes-256-cbc', encryptionKey);
  let decrypted = decipher.update(this.recoveryPhrase, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted; // Return the decrypted recovery phrase
};

// Example: Method to generate and save recovery phrase (mnemonic)
userSchema.methods.generateRecoveryPhrase = function () {
  const recoveryPhrase = bip39.generateMnemonic(); // Generate a 12-word mnemonic
  this.recoveryPhrase = recoveryPhrase; // Store the mnemonic (will be encrypted when saved)
  return recoveryPhrase;
};
module.exports = mongoose.model("User", userSchema);
