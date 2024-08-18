const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

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
  paymentMethod: {
    type: String,
    validate: {
      validator: function(value) {
        return (this.role === 'admin' || value);
      },
      message: 'Payment method is required for paid plans.'
    }
  },
  cardNumber: {
    type: String,
    validate: {
      validator: function(value) {
        return (this.role === 'admin' || value);
      },
      message: 'Card number is required for paid plans.'
    }
  },
  expiryDate: {
    type: String,
    validate: {
      validator: function(value) {
        return (this.role === 'admin' || value);
      },
      message: 'Expiry date is required for paid plans.'
    }
  },
  cvv: {
    type: String,
    validate: {
      validator: function(value) {
        return (this.role === 'admin' || value);
      },
      message: 'CVV is required for paid plans.'
    }
  },
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
  favorites: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Password' }]
});

// Password hashing middleware
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Generate auth token
userSchema.methods.generateAuthToken = function() {
  const token = jwt.sign({ _id: this._id }, process.env.SECRET_KEY);
  this.tokens = [{ token }];
  this.save();
  return token;
};

// Generate confirmation code
userSchema.methods.generateConfirmationCode = function() {
  const code = uuidv4();
  this.confirmationCode = code;
  return code;
};

// Find user by credentials
userSchema.statics.findByCredentials = async function(email, password) {
  const user = await this.findOne({ email });
  if (!user) {
    throw new Error('Invalid email');
  }
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
    if (this.resetToken.expiry && new Date(this.resetToken.expiry) < new Date()) {
      return false;
    }
    return true;
  } catch (error) {
    console.error(error);
    return false;
  }
};

module.exports = mongoose.model('User', userSchema);
