const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Folder = require("../model/folder");

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
    enum: ["email", "sms", "totp", "fingerprint", "webauthn", "null"],
    default: "email",
  },
  totpSecret: {
    type: String,
  },
  address: { type: String },
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
  },
  passphrase: {
    type: String,
  },
  fingerPrint: {
    type: String,
  },
  recoveryTokenExpiry: {
    type: Date,
    default: Date.now
  },
  recoveryToken: {
    type: String,
  },
  webAuthnClientId: {
    type: String,
  },
  webAuthnPublicKey: {
    type: String,
  },
  webAuthnChallenge: {
    type: String,
  },
  passkeysForWebAuth: {
    type: Array,

  }
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
  next();
});

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

  // const isMatch = await bcrypt.compare(password, user.password);
  // if (!isMatch) {
  //   throw new Error("Invalid password");
  // }
  return user;
};

// Verify reset token
userSchema.methods.verifyResetToken = function (token, user) {
  const isMatch = user && user.resetToken === token;
  const isExpired =
    user.resetTokenExpiry && new Date(user.resetTokenExpiry) < new Date();
  return isMatch && !isExpired;
};

userSchema.methods.createDefaultFolder = async function (userId) {
  const folderTypes = [
    "passwords",
    "notes",
    "cards",
    "proof",
    "files",
    "address",
  ];
  const folders = folderTypes.map((type) => ({
    user: userId,
    name: `${type.charAt(0).toUpperCase() + type.slice(1)} Folder`,
    type: type,
    isSpecial: true,
  }));

  await Folder.insertMany(folders);

}
module.exports = mongoose.model("User", userSchema);
