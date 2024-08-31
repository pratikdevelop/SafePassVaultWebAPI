const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const speakeasy = require('speakeasy'); // For TOTP


const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    match: /.+\@.+\..+/
  },
  password: {
    type: String,
  },
  role: {
    type: String,
    default: "admin"
  },
  confirmationCode: {
    type: String,
  },
  phone: {
    type: Number,
    required: true,
    match: /^[0-9]{10}$/
  },
  emailConfirmed: {
    type: Boolean,
    default: false,
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
  billingAddress: String,
  city: String,
  state: String,
  postalCode: String,
  country: String,
  stripeCustomerId: { type: String },
  plan: { type: String}, // Reference to Plan
  numberOfUsers: { type: Number, default: 1 },
  organization: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Organization' }],
  invitation: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Invitation' }],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  favorites: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Password' }],
  
  // MFA Fields
  mfaEnabled: {
    type: Boolean,
    default: false,
  },
  mfaMethod: {
    type: String,
    enum: ['email', 'sms', 'totp'],
    default: 'email',
  },
  totpSecret: {
    type: String,
  },

  // Passphrase Field
  passphrase: {
    type: String,
    // Optional: Add validation rules based on your requirements
    minlength: 6, // Example: minimum length
  },
});

// Password hashing middleware
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }

  if (this.isModified('passphrase')) {
    const salt = await bcrypt.genSalt(10);
    this.passphrase = await bcrypt.hash(this.passphrase, salt);
  }

  next();
});

// Generate auth token
userSchema.methods.generateAuthToken = function() {
  const token = jwt.sign({ _id: this._id }, process.env.SECRET_KEY);
  this.tokens = [{ token }];
  this.save();
  return token;
};

// Find user by credentials
userSchema.statics.findByCredentials = async function(email, password) {
  const user = await this.findOne({ email });
  if (!user) {
    throw new Error('Invalid email');
  }
  console.log('pp', password);
  console.log('user', user);
  
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new Error('Invalid password');
  }
  return user;
};

// Verify reset token
userSchema.methods.verifyResetToken = async function(token, user) {
  try {
    const isMatch = user && (user.resetToken === token);
    if (!isMatch) {
      return false;
    }
    if (user.resetTokenExpiry && new Date(user.resetTokenExpiry) < new Date()) {
      return false;
    }
    return true;
  } catch (error) {
    console.error(error);
    return false;
  }
};
userSchema.methods.generateTotpSecret = function () {
  const secret = speakeasy.generateSecret();
  this.totpSecret = secret.base32; // Save base32 secret for TOTP verification
  return secret;
};

userSchema.methods.verifyTotpCode = function (token) {
  return speakeasy.totp.verify({
    secret: this.totpSecret,
    encoding: 'base32',
    token
  });
};

module.exports = mongoose.model('User', userSchema);
