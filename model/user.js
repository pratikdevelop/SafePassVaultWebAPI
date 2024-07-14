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
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    default: "admin"
  },
  confirmationCode: {
    type: String,
    required: true,
  },
  phone: {
    type: Number,
    required: true,
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
  "Organization" : [{ type:  mongoose.Schema.Types.ObjectId, ref: 'Organization' }], // array of organization IDs the user is a member of
  "invitation" : [{ type:  mongoose.Schema.Types.ObjectId, ref: 'Invitation' }],
  createdAt: {
    type: Date,
    default: Date.now, // Set the default value to the current timestamp
  },
  updatedAt: {
    type: Date,
    default: Date.now, // Set the default value to the current timestamp
  },
});

// ... rest of your code ...


userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.generateAuthToken = function() {
  console.log("rrr", this._id);
  const token = jwt.sign({ _id: this._id }, process.env.SECRET_KEY);
  this.tokens = [{token}];
  this.save();
  return token;
};

userSchema.methods.generateConfirmationCode = function() {
  const code = uuidv4();
  this.confirmationCode = code;
  return code;
};

userSchema.statics.findByCredentials = async function(email, password) {
  const user = await this.findOne({ email });
  if (!user) {
    throw new Error('Invalid email');
  }
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new Error('Invalid Password');
  }
  return user;
};

userSchema.methods.verifyResetToken = async function (token, user) {
  try {
    // Compare hashed reset token with the provided token
    const isMatch = user &&( user.resetToken === token);
    if (!isMatch) {
      return false;
    }

    // Check if the reset token has expired (optional)
    if (this.resetToken.expiry && new Date(this.resetToken.expiry) < new Date()) {
      return false;
    }

    // Reset token is valid
    return true;
  } catch (error) {
    console.error(error);
    return false; // Consider throwing an error for specific handling
  }
};


module.exports = mongoose.model('User', userSchema);