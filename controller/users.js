const express = require("express")
const router = express.Router();
const User = require('../model/user');
const nodemailer = require('nodemailer');
const crypto = require('crypto'); // For generating secure tokens
const bcrypt = require('bcryptjs');

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false, 
  auth: {
    user:  process.env.EMAIL_USERNAME,
    pass:  process.env.EMAIL_PASSWORD,
  },
});

router.post('/register', async (req, res) => {
  const user = new User(req.body);
  try {
    const confirmationCode = user.generateConfirmationCode();
    user.confirmationCode = confirmationCode;
    const mailOptions = {
      from: 'passwordmanagementapp@gmail.com', // Your Gmail address
      to: req.body.email, // Recipient's email address
      subject: 'Verificaation Code Email',

      html: `<b>Hi ${req.body.name}</b>,
    <p> Your verification code is:${confirmationCode}</p>
      <p>Please enter this code to complete your Registeration.</p>
      Thanks,
      Password Management APP` // Optional: Use HTML for formatting
  };
  
  transporter.sendMail(mailOptions, async (error, info) => {
      if (error) {
          console.log('Error occurred while sending email:', error);
      } else {
        await user.save();
        console.log('Email sent:', info.response);
        res.status(201).send({ message: `User created successfully ${confirmationCode}` });
      }
  });
  
   
  } catch (error) {
    res.status(400).send({ message: `Error creating user ${error}` });
  }
});


router.post('/confirm-email', async (req, res) => {
  const { email, confirmationCode } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).send({ message: 'Invalid email' });
    }
    if (user.confirmationCode !== confirmationCode) {
      return res.status(400).send({ message: 'Invalid confirmation code' });
    }
    user.emailConfirmed = true;
    const token = user.generateAuthToken();
    // await user.save();
    res.status(200).send({ message: 'Email confirmed successfully', token });
  } catch (error) {
    console.error(error);
    res.status(400).send({ message: 'Error confirming email' });
  }
});

router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await User.findByCredentials(username, password);
    if (!user.emailConfirmed) {
      return res.status(400).send({ message: 'Email not confirmed' });
    }
    const token = user.generateAuthToken();
    res.status(200).send({ token });
  } catch (error) {
    console.error(error);
    res.status(400).send({ message: 'Invalid email or password' });
  }
});


// Get user profile
router.get('/profile/', async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).send({ message: 'User not found' });
    }
    res.status(200).send(user);
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: 'Error getting user profile', error });
  }
});

// Update user profile
router.put('/profile', async (req, res) => {
  const updates = Object.keys(req.body);
  const allowedUpdates = ['name', 'email', 'password'];
  const isValidOperation = updates.every(update => allowedUpdates.includes(update));

  if (!isValidOperation) {
    return res.status(400).send({ message: 'Invalid updates!' });
  }

  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).send({ message: 'User not found' });
    }

    updates.forEach(update => user[update] = req.body[update]);
    await user.save();
    res.status(200).send(user);
  } catch (error) {
    console.error(error);
    res.status(400).send({ message: 'Error updating user profile' });
  }
});

// Delete user account
router.delete('/profile', async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.user._id);
    if (!user) {
      return res.status(404).send({ message: 'User not found' });
    }
    res.status(200).send({ message: 'User deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: 'Error deleting user account' });
  }
});

router.post("/reset-password", async (req, res) => {
  try {
    const email = req.body.email; 
    // Find user by email
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).send({ message: 'User email not found' });
    }
    console.log("reset", user);
    // Generate a secure reset token with an expiry time of 10 minutes
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = Date.now() + 600000; // 10 minutes in milliseconds

    // Update user document with reset token and expiry
    await User.updateOne(
      { _id: user._id },
      { $set: { resetToken, resetTokenExpiry } }
    );

    const resetLink = `http://localhost:4200/reset-password?id=${user._id}&token=${resetToken}`;

    const mailOptions = {
      from: 'passwordmanagementapp@gmail.com', // Your Gmail address
      to: email, // Recipient's email address
      subject: 'PASSWORD RESET LINK',

      html: `<b>Hi ${user.name}</b>,
             <p>Click on the following link to reset your password within 10 minutes:</p>
             <a href="${resetLink}">Reset Password</a>
             <p>If you did not request a password reset, please ignore this email.</p>
             Thanks,<br>
             Password Management APP` // Optional: Use HTML for formatting
    };

    transporter.sendMail(mailOptions, async (error, info) => {
      if (error) {
        res.status(500).send({ message: 'Error sending email' });
      } else {
        res.status(200).send({ message: 'Password reset link sent successfully' });
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: 'Internal server error' });
  }
});

router.get("/verify-reset-link", async (req, res) => {
  try {
    const { id, toekn } = req.query; // Destructure request body

    // Validate user ID and reset token
    if (!id || !toekn) {
      return res.status(400).json({ verified:false, message: "Missing user ID or reset token" });
    }

    // Find user by ID
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ verified:false, message: "User not found" });
    }

    // Verify reset token and expiration (replace with your implementation)
    const isValidToken = await user.verifyResetToken(toekn, user); // Assuming a method on the User model
    if (!isValidToken) {
      return res.status(400).json({ verified:false, message: "Invalid or expired reset token" });
    }

    // Reset token is valid, user can proceed to reset password (redirect or send success message)
    res.json({ verified:true, message: "Reset link verified. You can now reset your password." });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error verifying reset link" });
  }
});

router.patch("/change-password/:id",  async (req, res) => {
  try {
    const {  password, comparePassword } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    await user.save();

    res.status(200).json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error changing password' });
  }
}
)

module.exports = router;