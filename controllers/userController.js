const express = require('express');
const User = require('../model/user');
const Organization = require('../model/Organization');
const Invitation = require('../model/Invitation');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { check, validationResult } = require('express-validator');

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USERNAME,
    pass: process.env.EMAIL_PASSWORD,
  },
});

// Registration endpoint
exports.registerUser = async (req, res) => {
  try {
    const { email, password, name, phone, role, billingAddress, city, state, postalCode, country, paymentMethod, cardNumber, expiryDate, cvv } = req.body;
    
    if (role && (!billingAddress || !city || !state || !postalCode || !country || !paymentMethod || !cardNumber || !expiryDate || !cvv)) {
      return res.status(400).send({ message: 'Billing and payment information is required for paid plans.' });
    }

    const user = new User({ email, password, name, phone, role, billingAddress, city, state, postalCode, country, paymentMethod, cardNumber, expiryDate, cvv });
    const confirmationCode = user.generateConfirmationCode();
    user.confirmationCode = confirmationCode;

    const organization = new Organization({
      name: `${name}'s Organization`,
      owner: user._id,
    });

    user.organization.push(organization._id);

    const mailOptions = {
      from: 'passwordmanagementapp@gmail.com',
      to: email,
      subject: 'Verification Code Email',
      html: `<b>Hi ${name}</b>,
      <p>Your verification code is: ${confirmationCode}</p>
      <p>Please enter this code to complete your registration.</p>
      <p>Thanks,</p>
      <p>Password Management APP</p>`
    };
    
    transporter.sendMail(mailOptions, async (error, info) => {
      if (error) {
        console.log('Error occurred while sending email:', error);
        return res.status(500).send({ message: 'Error occurred while sending email' });
      } else {
        await user.save();
        await organization.save();
        console.log('Email sent:', info.response);
        res.status(201).send({ message: `User created successfully. Verification code sent to ${email}` });
      }
    });
  } catch (error) {
    res.status(400).send({ message: `Error creating user: ${error.message}` });
  }
};

// Confirm email endpoint
exports.confirmEmail = async (req, res) => {
  const { email, confirmationCode } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).send({ message: 'Invalid email' });
    }
    if (user.confirmationCode !== confirmationCode.trim()) {
      return res.status(400).send({ message: 'Invalid confirmation code' });
    }
    user.emailConfirmed = true;
    const token = user.generateAuthToken();
    res.status(200).send({ message: 'Email confirmed successfully', token });
  } catch (error) {
    console.error(error);
    res.status(400).send({ message: 'Error confirming email' });
  }
};

// Login endpoint
exports.loginUser = async (req, res) => {
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
};

// Get user profile
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('organization');
    if (!user) {
      return res.status(404).send({ message: 'User not found' });
    }
    res.status(200).send(user);
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: 'Error getting user profile', error });
  }
};

// Update user profile
exports.updateProfile = async (req, res) => {
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
};

// Delete user account
exports.deleteProfile = async (req, res) => {
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
};

// Reset password
exports.resetPassword = async (req, res) => {
  try {
    const email = req.body.email;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).send({ message: 'User email not found' });
    }
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = Date.now() + 600000; // 10 minutes in milliseconds
    await User.updateOne(
      { _id: user._id },
      { $set: { resetToken, resetTokenExpiry } }
    );

    const resetLink = `https://passwordmanagementrouter.netlify.app/reset-password?id=${user._id}&token=${resetToken}`;

    const mailOptions = {
      from: 'passwordmanagementapp@gmail.com',
      to: email,
      subject: 'PASSWORD RESET LINK',
      html: `<b>Hi ${user.name}</b>,
             <p>Click on the following link to reset your password within 10 minutes:</p>
             <a href="${resetLink}">Reset Password</a>
             <p>If you did not request a password reset, please ignore this email.</p>
             Thanks,<br>
             Password Management APP`
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
};

// Verify reset link
exports.verifyResetLink = async (req, res) => {
  try {
    const { id, token } = req.query;

    if (!id || !token) {
      return res.status(400).json({ verified: false, message: "Missing user ID or reset token" });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ verified: false, message: "User not found" });
    }

    const isValidToken = await user.verifyResetToken(token);
    if (!isValidToken) {
      return res.status(400).json({ verified: false, message: "Invalid or expired reset token" });
    }

    res.json({ verified: true, message: "Reset link verified. You can now reset your password." });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error verifying reset link" });
  }
};

// Create organization
exports.createOrganization = async (req, res) => {
  const { name, description } = req.body;
  const owner = req.user;
  try {
    const organization = new Organization({ name, description, owner });
    await organization.save();
    res.status(201).json({ message: 'Organization created successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error creating organization' });
  }
};

// Send invitation to join an organization
exports.sendInvitation = async (req, res) => {
  const organizationId = req.params.organizationId;
  const recipientId = req.body.recipientId;
  const sender = req.user;

  try {
    const organization = await Organization.findById(organizationId);
    if (!organization) {
      return res.status(404).json({ message: 'Organization not found' });
    }

    const recipient = await User.findById(recipientId);
    if (!recipient) {
      return res.status(404).json({ message: 'Recipient not found' });
    }

    const invitation = new Invitation({
      sender: sender._id,
      recipient: recipient._id,
      organization: organization._id
    });

    await invitation.save();

    // Send email invitation
    const mailOptions = {
      from: 'passwordmanagementapp@gmail.com',
      to: recipient.email,
      subject: 'Invitation to Join Organization',
      html: `<b>Hi ${recipient.name}</b>,
             <p>You have been invited to join the organization '${organization.name}' by ${sender.name}.</p>
             <p>Please click the following link to accept the invitation:</p>
             <a href="https://passwordmanagementrouter.netlify.app/accept-invitation?id=${invitation._id}">Accept Invitation</a>
             <p>Thanks,<br>Password Management APP</p>`
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error('Error sending invitation email:', error);
        return res.status(500).json({ message: 'Error sending invitation email' });
      } else {
        res.status(200).json({ message: 'Invitation sent successfully' });
      }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error sending invitation' });
  }
};

exports.logout= async (req,res) =>{
    const userId = req.user._id; // Extract user ID from the decoded token
    try {
      const user = await User.findOneAndUpdate(
        { _id: userId }, // Find the user by ID
        { $set: { tokens: [] } } // Update tokens and set blacklisted flag
      );
  
      if (!user) {
        return res.status(404).send({ message: 'User not found' });
      }
  
      res.status(200).send({ message: 'Successfully logged out' });
    } catch (err) {
      console.error('Error logging out user:', err);
      res.status(500).send({ message: 'Internal server error' });
    }
}