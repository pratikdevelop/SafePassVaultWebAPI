const User = require("../model/user");
const Organization = require("../model/Organization");
const nodemailer = require("nodemailer");
const crypto = require("crypto");
const { v4: uuidv4 } = require("uuid");
const bcrypt = require("bcryptjs");
const Invitation = require('../model/Invitation')
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);


const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USERNAME,
    pass: process.env.EMAIL_PASSWORD,
  },
});
const twilio = require("twilio");
const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);
exports.getStripePlans = async (req, res) => {
  try {
    const products = await stripe.products.list();
    const prices = await stripe.prices.list();
    
    const plans = prices.data.map(price => {
      const product = products.data.find(p => p.id === price.product);
      const metadata = product.metadata;

      return {
        id: price.id,
        title: product.name,
        amount: price.unit_amount / 100, // Convert cents to dollars
        currency: price.currency,
        interval: price.recurring.interval,
        intervalCount: price.recurring.interval_count,
        features: JSON.parse(product.metadata.features),
        buttonLink: metadata.buttonLink,
        buttonText: metadata.buttonText,
        hasTrial: metadata.hasTrial,
        queryParams: metadata.queryParams ? JSON.parse(metadata.queryParams) : {}, // Parsing queryParams
        trialLink: metadata.trialLink,
        trialQueryParams: metadata.trialQueryParams ? JSON.parse(metadata.trialQueryParams) : {}, // Parsing trialQueryParams
      };
    });

    // Send the formatted plan data as a JSON response
    res.status(200).json({ plans });
  } catch (error) {
    console.error('Error fetching plans from Stripe:', error);
    // Send an error response with a status code and message
    res.status(500).json({ message: 'Unable to fetch plans from Stripe.', error: error.message });
  }
};

exports.registerUser = async (req, res) => {
  try {
    const {
      email,
      password,
      name,
      phone,
      role,
      billingAddress,
      city,
      state,
      postalCode,
      country,
      token, // Stripe token from CardElement
      planId, // Stripe plan ID for subscription
      numberOfUsers = 1
    } = req.body;

    // Validate billing info for paid plans
    if (
      role &&
      (!billingAddress ||
        !city ||
        !state ||
        !postalCode ||
        !country ||
        !token ||
        !planId)
    ) {
      return res.status(400).send({
        message: "Billing and payment information is required for paid plans.",
      });
    }

    // Find the plan details
    // const plan = await Plan.findOne({ planId });

    // if (!plan) {
    //   return res.status(400).send({ message: "Invalid plan ID." });
    // }

    // Create a payment method
    const paymentMethod = await stripe.paymentMethods.create({
      type: 'card',
      card: { 
        token: token 
      },
    });

    // Create a customer
    const customer = await stripe.customers.create({
      email,
      payment_method: paymentMethod.id,
      invoice_settings: {
        default_payment_method: paymentMethod.id,
      },
    });

    // Create a subscription
    const subscription = await stripe.subscriptions.create({
      customer: customer.id,
      items: [
        {
          price: planId, // The Stripe price ID for the subscription plan
        },
      ],
      expand: ['latest_invoice.payment_intent'],
    });

    // Handle subscription confirmation
    const paymentIntent = subscription.latest_invoice.payment_intent;

    if (paymentIntent.status !== 'succeeded') {
      return res
        .status(400)
        .send({ message: "Payment failed, please try again." });
    }

    // Create the user and organization
    const user = new User({
      email,
      password,
      name,
      phone,
      role,
      billingAddress,
      city,
      state,
      postalCode,
      country,
      stripeCustomerId: customer.id,
      plan: planId, // Reference to the Plan document
      numberOfUsers,
      subscriptionId: subscription.id, // Save Stripe subscription ID
    });

    const confirmationCode = crypto.randomInt(100000, 999999).toString();
    user.confirmationCode = confirmationCode;

    const organization = new Organization({
      name: `${name}'s Organization`,
      owner: user._id,
    });

    user.organization = organization._id;

    // Send confirmation email
    const mailOptions = {
      from: 'passwordmanagementapp@gmail.com',
      to: email,
      subject: 'Verification Code Email',
      html: `<b>Hi ${name}</b>,
      <p>Your verification code is: ${confirmationCode}</p>
      <p>Please enter this code to complete your registration.</p>
      <p>Thanks,</p>
      <p>Password Management APP</p>`,
    };

    transporter.sendMail(mailOptions, async (error, info) => {
      if (error) {
        console.log('Error occurred while sending email:', error);
        return res
          .status(500)
          .send({ message: "Error occurred while sending email" });
      } else {
        await user.save();
        await organization.save();
        res.status(201).send({
          message: `User created successfully. Verification code sent to ${email}`,
        });
      }
    });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(400).send({ message: `Error creating user: ${error.message}` });
  }
};



// Confirm email endpoint
exports.confirmEmail = async (req, res) => {
  const { email, confirmationCode } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).send({ message: "Invalid email" });
    }
    console.log("cc", user);

    if (user.confirmationCode !== confirmationCode) {
      return res.status(400).send({ message: "Invalid confirmation code" });
    }
    user.emailConfirmed = true;
    const secret = user.generateTotpSecret(); // Generate TOTP secret
    const token = user.generateAuthToken();
    res.status(200).send({ message: "Email confirmed successfully", token });
  } catch (error) {
    console.error(error);
    res.status(400).send({ message: "Error confirming email" });
  }
};

// Login endpoint
exports.loginUser = async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await User.findByCredentials(username, password);
    if (!user.emailConfirmed) {
      return res.status(400).send({ message: "Email not confirmed" });
    }
    const token = user.generateAuthToken();
    res.status(200).send({ token });
  } catch (error) {
    console.error(error);
    res.status(400).send({ message: "Invalid email or password" });
  }
};

exports.getAllUsers = async(req, res)=>{
    try {
      // Get the current user ID from the request
      const userId = req.user._id;
  
      // Find all invitations where the sender is the current user
 const invitations = await Invitation.find({ sender: userId })
      .populate({
        path: 'recipient',
        select: 'name email phone'  
      })
      .select('status organization createdAt')
      .exec();
      // Send the invitations as the response
      res.status(200).json(invitations);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Error retrieving invitations' });
    }
}


// Get user profile
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate("organization");
    if (!user) {
      return res.status(404).send({ message: "User not found" });
    }
    res.status(200).send(user);
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: "Error getting user profile", error });
  }
};

// Update user profile
exports.updateProfile = async (req, res) => {
  const updates = Object.keys(req.body);
  const allowedUpdates = ["name", "email", "password"];
  const isValidOperation = updates.every((update) =>
    allowedUpdates.includes(update)
  );

  if (!isValidOperation) {
    return res.status(400).send({ message: "Invalid updates!" });
  }

  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).send({ message: "User not found" });
    }

    updates.forEach((update) => (user[update] = req.body[update]));
    await user.save();
    res.status(200).send(user);
  } catch (error) {
    console.error(error);
    res.status(400).send({ message: "Error updating user profile" });
  }
};

// Delete user account
exports.deleteProfile = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.user._id);
    if (!user) {
      return res.status(404).send({ message: "User not found" });
    }
    res.status(200).send({ message: "User deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: "Error deleting user account" });
  }
};

// Reset password
exports.resetPassword = async (req, res) => {
  try {
    const email = req.body.email;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).send({ message: "User email not found" });
    }
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenExpiry = Date.now() + 600000; // 10 minutes in milliseconds

    await User.updateOne(
      { _id: user._id },
      { $set: { resetToken, resetTokenExpiry } }
    );
    const payload = `${user._id}:${resetToken}`;
    const encodedToken = Buffer.from(payload).toString('base64');

    // Create the reset link
    const resetLink = `http://localhost:4200/auth/change-password?token=${encodedToken}`;

    // Configure the email options
    const mailOptions = {
      from: "passwordmanagementapp@gmail.com",
      to: email,
      subject: "Password Reset Link",
      html: `<b>Hi ${user.name}</b>,
             <p>We received a request to reset your password. Click the link below to reset your password:</p>
             <p><a href="${resetLink}">Reset Password</a></p>
             <p>This link is valid for 10 minutes.</p>
             <p>If you did not request a password reset, please ignore this email.</p>
             Thanks,<br>
             Password Management APP`,
    };

    transporter.sendMail(mailOptions, async (error, ) => {
      if (error) {
        res.status(500).send({ message: "Error sending email" });
      } else {
        res.status(200).send({
          message: "Password reset link sent successfully",
          userId: user._id,
        });
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: "Internal server error" });
  }
};

// Verify reset link
exports.verifyResetLink = async (req, res) => {
  try {
    const { id, token } = req.query;

    if (!id || !token) {
      return res
        .status(400)
        .json({ verified: false, message: "Missing user ID or reset token" });
    }

    const user = await User.findById(id);
    if (!user) {
      return res
        .status(404)
        .json({ verified: false, message: "User not found" });
    }

    const isValidToken = await user.verifyResetToken(token, user);
    if (!isValidToken) {
      return res
        .status(400)
        .json({ verified: false, message: "Invalid or expired reset token" });
    }

    res.json({
      verified: true,
      message: "Reset link verified. You can now reset your password.",
    });
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
    res.status(201).json({ message: "Organization created successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error creating organization" });
  }
};
exports.getOrganizations = async (req, res) => {
  try {
    const organizations = await Organization.find({
      owner: req.user._id,
    })
      .populate("owner")
      .exec();
    res.json(organizations);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching organizations" });
  }
};

exports.sendInvitation = async (req, res) => {
  const organizationId = req.params.organizationId;
  const { email, phone, name } = req.body;
  try {
    const organization = await Organization.findById(organizationId);
    if (!organization) {
      return res.status(404).json({ message: "Organization not found" });
    }
    const sender = await User.findById(req.user._id);
    const recipient = new User({
      email,
      name,
      phone,
    });

    await recipient.save();

    const invitation = new Invitation({
      sender: req.user._id,
      recipient: recipient._id,
      organization: organization._id,
    });

    await invitation.save();

    sender.invitation.push(invitation._id);
    await sender.save();
    // Send email invitation
    const mailOptions = {
      from: "passwordmanagementapp@gmail.com",
      to: recipient.email,
      subject: "Invitation to Join Organization",
      html: `<b>Hi ${recipient.name}</b>,
             <p>You have been invited to join the organization '${organization.name}' by ${sender.name}.</p>
             <p>Please click the following link to accept the invitation:</p>
             <a href="https://passwordmanagementrouter.netlify.app/auth/accept-invitation?id=${invitation._id}">Accept Invitation</a>
             <p>Thanks,<br>Password Management APP</p>`,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error("Error sending invitation email:", error);
        return res
          .status(500)
          .json({ message: "Error sending invitation email" });
      } else {
        res.status(200).json({ message: "Invitation sent successfully" });
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error sending invitation" });
  }
};

exports.logout = async (req, res) => {
  const userId = req.user._id; // Extract user ID from the decoded token
  try {
    const user = await User.findOneAndUpdate(
      { _id: userId }, // Find the user by ID
      { $set: { tokens: [] } } // Update tokens and set blacklisted flag
    );

    if (!user) {
      return res.status(404).send({ message: "User not found" });
    }

    res.status(200).send({ message: "Successfully logged out" });
  } catch (err) {
    console.error("Error logging out user:", err);
    res.status(500).send({ message: "Internal server error" });
  }
};

exports.changePassword = async (req, res) => {
  const userId = req.params.id; // Extracted from auth middleware
  const { confirmPassword, password } = req.body;

  if (confirmPassword !== password) {
    return res.status(400).json({
      message: "Current password and new password cannot be the same",
    });
  }

  try {
    // Find the user
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const user = await User.findByIdAndUpdate(userId, {
      password: hashedPassword,
    });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ message: "Password changed successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.acceptInvitation = async (req, res) => {
  const { invitationId, passowrd, email } = req.body;

  try {
    // Find the invitation
    const invitation = await Invitation.findById(invitationId).populate(
      "recipient"
    );
    if (!invitation) {
      return res.status(404).json({ message: "Invitation not found" });
    }

    // Check if invitation is already used or expired
    if (invitation.isAccepted) {
      return res.status(400).json({ message: "Invitation already accepted" });
    }

    // Check if the email matches the recipient's email
    if (invitation.recipient.email !== email) {
      return res.status(400).json({ message: "Email does not match" });
    }

    // Hash the password and update the user record
    const hashedPassword = await bcrypt.hash(passowrd, 10);
    const confirmationCode = uuidv4();
    const user = await User.findByIdAndUpdate(invitation.recipient, {
      password: hashedPassword,
      confirmationCode: confirmationCode,
    });

    // Mark the invitation as accepted
    invitation.status = "accepted";
    await invitation.save();

    // Generate a verification code

    // Send the verification code via email
    const mailOptions = {
      from: "passwordmanagementapp@gmail.com",
      to: invitation.recipient.email,
      subject: "Verification Code",
      html: `<b>Hi ${invitation.recipient.name}</b>,
             <p>Your invitation has been accepted.</p>
             <p>Please use the following verification code to complete the process:</p>
             <p><strong>${confirmationCode}</strong></p>
             <p>Thanks,<br>Password Management APP</p>`,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error("Error sending verification code email:", error);
        return res
          .status(500)
          .json({ message: "Error sending verification code email" });
      } else {
        res
          .status(200)
          .json({
            message:
              "Invitation accepted and verification code sent successfully",
          });
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error accepting invitation" });
  }
};

exports.saveMfaSettings = async (req, res) => {
  try {
    const userId = req.user._id; // From auth middleware
    const { mfaEnabled, mfaMethod, totpSecret } = req.body;

    // Find the user and update MFA settings
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).send("User not found");
    }

    user.mfaEnabled = mfaEnabled;
    user.mfaMethod = mfaMethod;
    if (mfaMethod === "totp") {
      user.totpSecret = totpSecret; // Ensure this is securely handled
    } else {
      user.totpSecret = null; // Clear TOTP secret if not using TOTP
    }

    await user.save();
    res.status(200).json({ message: "MFA settings updated successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.verifyMfaCode = async (req, res) => {
  const { email, mfaCode } = req.body;
  try {
    const user = await User.findOne({email});
    if (!user) {
      return res.status(404).send({ message: "User not found" });
    }

    if (user.mfaCode !== mfaCode || user.mfaCodeExpiry < Date.now()) {
      return res.status(400).send({ message: "Invalid or expired MFA code" });
    }

    user.mfaCode = undefined; // Clear MFA code
    user.mfaCodeExpiry = undefined; // Clear MFA code expiry

    await user.save();

    const token = user.generateAuthToken();
    res.status(200).send({ token, 
      message: "MFA code verified successfully",
      success: true
     });
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: "Error verifying MFA code" });
  }
};

exports.loginUser = async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await User.findByCredentials(username, password);

    if (!user.emailConfirmed) {
      return res.status(400).send({ message: "Email not confirmed" });
    }

    if (user.mfaEnabled) {
      const mfaCode = uuidv4();
      user.mfaCode = mfaCode; // Store MFA code temporarily
      user.mfaCodeExpiry = Date.now() + 300000; // MFA code expires in 5 minutes
      await user.save();

      // Send MFA code based on user's MFA method
      if (user.mfaMethod === "email") {
        const mailOptions = {
          from: "passwordmanagementapp@gmail.com",
          to: user.email,
          subject: "Your MFA Code",
          html: `<b>Hi ${user.name}</b>,
                 <p>Your MFA code is: <strong>${mfaCode}</strong></p>
                 <p>Please enter this code to complete your login.</p>
                 <p>Thanks,<br>Password Management APP</p>`,
        };

        transporter.sendMail(mailOptions, (error) => {
          if (error) {
            return res
              .status(500)
              .send({ message: "Error sending MFA code via email" });
          }
          res
            .status(200)
            .send({
              message: "MFA code sent via email",
              mfaRequired: true,
              mfaMethod: user.mfaMethod,
            });
        });
      } else if (user.mfaMethod === "sms") {
        twilioClient.messages.create(
          {
            body: `Your MFA code is: ${mfaCode}`,
            from: process.env.TWILIO_PHONE_NUMBER,
            to: user.phone,
          },
          (error) => {
            if (error) {
              return res
                .status(500)
                .send({ message: "Error sending MFA code via SMS" });
            }
            res
              .status(200)
              .send({
                message: "MFA code sent via SMS",
                userId: user._id,
                mfaRequired: true,
                mfaMethod: user.mfaMethod,
              });
          }
        );
      } else if (user.mfaMethod === "totp") {
        res
          .status(200)
          .send({
            message: "TOTP MFA enabled",
            userId: user._id,
            mfaRequired: true,
            mfaMethod: user.mfaMethod,
          });
      } else {
        res.status(400).send({ message: "Unsupported MFA method" });
      }
    } else {
      const token = user.generateAuthToken();
      res.status(200).send({ token });
    }
  } catch (error) {
    console.error(error);
    res.status(400).send({ message: "Invalid email or password" });
  }
};
