const User = require("../model/user");
const Organization = require("../model/Organization");
const crypto = require("crypto");
const { v4: uuidv4 } = require("uuid");
const bcrypt = require("bcryptjs");
const planController = require("./plan-controller");
const otplib = require("otplib");
const qrcode = require("qrcode");
const jwt = require("jsonwebtoken");
const fs = require("fs");
const  s3  = require("../config/awsconfig");
const { sendSms } = require("../config/twilloConfig");
const mongoose = require("mongoose");
const { validateUserRegistration } = require("../utlis/validators"); // Import validation function
const { sendEmail } = require("../utlis/email"); // Import email sender function
const {
  generateRegistrationOptions,
  verifyAuthenticationResponse,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
} = require("@simplewebauthn/server");

exports.createUser = async (req, res) => {
  try {
    const validation = await validateUserRegistration(req.body);
    if (!validation.isValid) {
      return res.status(400).json({ errors: validation.errors });
    }
    const {
      email,
      password,
      name,
      phone,
      address,
      city,
      state,
      postalCode,
      country,
    } = req.body;
    const trialUser = new User({
      email,
      password,
      name,
      phone,
      address,
      city,
      state,
      postalCode,
      country,
    });

    const organization = new Organization({
      name: `${name}'s Organization`,
      owner: trialUser._id,
    });
    trialUser.organization = organization._id;
    const confirmationCode = crypto.randomInt(100000, 999999).toString();
    trialUser.confirmationCode = confirmationCode;
    const mailOptions = {
      from: "safepassvault@gmail.com",
      to: email,
      subject: "Your SafePassVault Verification Code",
      html: `
        <b>Hello ${name},</b>
        <p>Thank you for registering with SafePassVault. To complete your registration, please use the following verification code:</p>
        <p style="font-size: 18px; font-weight: bold; color: #333;">${confirmationCode}</p>
        <p>Enter this code in the required field to confirm your account. This code will expire shortly, so please use it promptly.</p>
        <p>If you did not request this code or have any questions, please contact our support team at 
        <a href="mailto:safepassvault@gmail.com">safepassvault@gmail.com</a>.</p>
        <p>Thanks,<br>The SafePassVault Team</p>
      `,
    };
    await sendEmail(mailOptions);
    const user = await trialUser.save();
    await organization.save();
    return res.status(201).json({
      userId: user._id,
      message: `User created successfully. A verification email has been sent to ${email}.`,
    });
  } catch (error) {
    return res
      .status(400)
      .json({ message: `Error creating trial user: ${error.message}` });
  }
};

exports.addPrivateAndPublicKey = async (req, res) => {
  try {
    const { email, passphrase } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const { publicKey, privateKey } = crypto.generateKeyPairSync("rsa", {
      modulusLength: 2048,
    });
    const publicKeyPEM = publicKey.export({ type: "spki", format: "pem" });
    const privateKeyPEM = privateKey.export({ type: "pkcs8", format: "pem" });
    const encryptedRecoveryPhrase = crypto.publicEncrypt(
      publicKeyPEM,
      Buffer.from(passphrase)
    );
    const signature = crypto.sign("sha256", Buffer.from(passphrase), {
      key: privateKeyPEM,
      padding: crypto.constants.RSA_PKCS1_PSS_PADDING,
    });

    await user.updateOne({
      $set: {
        publicKey: publicKeyPEM,
        privateKey: privateKeyPEM,
        passphrase: encryptedRecoveryPhrase.toString("base64"),
        fingerPrint: signature.toString("base64"),
      },
    });
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="private-key.pem"'
    );
    return res.status(200).json({
      message: "Public and private key added successfully",
      publicKeyPEM,
      privateKeyPEM,
    });
  } catch (error) {
    return res.status(400).json({
      message: `Error adding public and private key: ${error.message}`,
    });
  }
};

// Serve private key file on secure endpoint
exports.downloadPrivateKey = (req, res) => {
  const userId = req.params.userId;
  const privateKeyPath = path.join(
    __dirname,
    "privateKeys",
    `${userId}_private_key.pem`
  );

  if (fs.existsSync(privateKeyPath)) {
    res.download(privateKeyPath, `${userId}_private_key.pem`, (err) => {
      if (err) {
        return res
          .status(500)
          .json({ message: "Error downloading the private key." });
      }
    });
  } else {
    return res.status(404).json({ message: "Private key not found." });
  }
};

exports.uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }
    const params = {
      Bucket: process.env.S3_BUCKET_NAME_FILE_STORAGE,
      Key: `uploads/${Date.now()}_${req.file.originalname}`,
      Body: req.file.buffer,
      ContentType: req.file.mimetype,
    };
    const data = await s3.upload(params).promise();
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    user.userImage = data.Location; // Store the S3 URL in the userImage field
    await user.save();
    res.status(200).json({
      message: "File uploaded and user image updated successfully",
      url: data.Location,
      user,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "File upload failed", error: error.message });
  }
};
// Confirm email endpointre
exports.confirmEmail = async (req, res) => {
  const { email, confirmationCode } = req.body;

  try {
    const user = await User.findOneAndUpdate(
      { email },
      {
        $set: { emailConfirmed: true, confirmationCode: null },
      },
      { new: true } // Return the modified document
    );

    if (!user) {
      return res
        .status(400)
        .send({ message: "Invalid email or confirmation code" });
    }

    const token = user.generateAuthToken();
    res.status(200).json({ message: "Email confirmed successfully", token });
  } catch (error) {
    res.status(400).json({ message: "Error confirming email" });
  }
};

// Get user profile
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate("organization");
    if (!user) {
      return res.status(404).send({ message: "User not found" });
    }
    let planDetails = null;
    try {
      planDetails = await planController.getPlanDetails(user._id);
    } catch (error) {
      return res.status(500).send({ message: "Error fetching plan details" });
    }

    res.status(200).json({
      user,
      planDetails, // Include plan details in the response
    });
  } catch (error) {
    res.status(500).send({ message: "Error getting user profile", error });
  }
};

// Update user profile
exports.updateProfile = async (req, res) => {
  const updates = Object.keys(req.body);

  const allowedUpdates = [
    "name",
    "email",
    "address",
    "state",
    "phone",
    "postalCode",
    "city",
    "country",
  ];
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
    const encodedToken = Buffer.from(payload).toString("base64");

    // Create the reset link
    const resetLink = `${process.env.FRONTEND_URL}/auth/change-password?token=${encodedToken}`;

    // Configure the email options
    const mailOptions = {
      from: "safePassVault@gmail.com",
      to: email,
      subject: "SafePassVault Password Reset Request",
      html: `
        <b>Hi ${user.name},</b>
        <p>We received a request to reset your password for your SafePassVault account. To proceed with resetting your password, please click the link below:</p>
        <p>
          <a href="${resetLink}" style="font-size: 16px; color: #4CAF50; text-decoration: none;">
            Reset Password
          </a>
        </p>
        <p>This link is valid for 10 minutes. After that, you will need to request a new password reset link if needed.</p>
        <p>If you did not request a password reset, you can safely ignore this email. Your password will remain unchanged.</p>
        <p>Thank you,<br>The SafePassVault Team</p>
        <hr>
        <p style="font-size: 12px; color: #666;">
          This is an automated message. Please do not reply to this email. For assistance, contact our support team at <a href="mailto:safePassVault@gmail.com">safePassVault@gmail.com</a>.
        </p>
      `,
    };

    await sendEmail(mailOptions);

    res.status(200).send({
      message: "Password reset link sent successfully",
      userId: user._id,
    });
  } catch (error) {
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
    res.status(500).json({ message: "Error verifying reset link" });
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
    res.status(500).send({ message: "Internal server error" });
  }
};

exports.changePassword = async (req, res) => {
  const param = req.params.param; // Extracted from auth middleware
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
    const user = !mongoose.Types.ObjectId.isValid(param)
      ? await User.findOneAndUpdate(
        {
          email: param,
        },
        {
          $set: {
            password: hashedPassword,
          },
        }
      )
      : await User.findByIdAndUpdate(param, {
        $set: {
          password: hashedPassword,
        },
      });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ message: "Password changed successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.saveMfaSettings = async (req, res) => {
  try {
    const userId = req.user._id; // User ID from auth middleware
    const { mfaEnabled, mfaMethod, totpSecret, securityPin } = req.body;

    // Find the user by ID
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.mfaMethod === mfaMethod) {
      return res.status(400).json({ message: "MFA method already set" });
    }

    // Update user MFA settings
    user.mfaEnabled = mfaEnabled;
    user.mfaMethod = mfaMethod;

    // If TOTP is selected as the MFA method, verify the provided TOTP secret
    if (mfaMethod === "totp") {
      const isValid = otplib.authenticator.verify({
        token: totpSecret,
        secret: user.totpSecret,
      });

      if (!isValid) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid TOTP token" });
      }
    } else if (mfaMethod === 'webauthn') {
      // Verify WebAuthn credentials
      user.securityPin = securityPin
    }
    // Save updated user settings
    await user.save();

    // Respond with success message
    return res.status(200).json({
      success: true,
      message:
        mfaMethod === "totp"
          ? "2FA verified and settings updated successfully"
          : "MFA settings updated successfully",
    });
  } catch (error) {
    console.log(`Error saving MFA settings: ${error.message} (${error.stack})`);

    return res.status(500).json({ message: "Server error" });
  }
};

exports.verifyMfaCode = async (req, res) => {
  const { email, mfaCode, method, totpCode } = req.body;

  try {
    // Check for user existence
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Handle SMS or email verification
    if (method === "sms" || method === "email") {
      if (user.mfaCode !== mfaCode || user.mfaCodeExpiry < Date.now()) {
        return res.status(400).json({ message: "Invalid or expired MFA code" });
      }

      // Clear MFA code and expiry after successful verification
      user.mfaCode = undefined;
      user.mfaCodeExpiry = undefined;
      await user.save();

      // Generate authentication token
      const token = user.generateAuthToken();
      return res.status(200).json({
        token,
        message: "MFA code verified successfully",
        success: true,
      });
    }

    // Handle TOTP verification
    if (method === "totp") {
      const isValid = otplib.authenticator.verify({
        token: totpCode,
        secret: user.totpSecret,
      });

      if (isValid) {
        const token = user.generateAuthToken();
        return res.status(200).json({
          success: true,
          token,
          message: "2FA verified successfully",
        });
      } else {
        return res
          .status(400)
          .json({ success: false, message: "Invalid token" });
      }
    }

    // Handle invalid MFA method
    return res.status(400).json({
      message: "Invalid MFA verification method",
    });
  } catch (error) {
    return res.status(500).json({ message: "Error verifying MFA code" });
  }
};

exports.loginUser = async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await User.findByCredentials(username, password);

    if (user.mfaEnabled) {
      const mfaCode = crypto.randomInt(100000, 999999).toString();
      user.mfaCode = mfaCode; // Store MFA code temporarily
      user.mfaCodeExpiry = Date.now() + 300000; // MFA code expires in 5 minutes
      await user.save();

      // Send MFA code based on user's MFA method
      if (user.mfaMethod === "email") {
        const mailOptions = {
          from: "safePassVault@gmail.com",
          to: user.email,
          subject: "Your Multi-Factor Authentication (MFA) Code",
          html: `
            <b>Hi ${user.name},</b>
            <p>We received a request to access your SafePassVault account. As an additional layer of security, please use the following Multi-Factor Authentication (MFA) code to proceed with your login:</p>
            <span style="font-size: 2rem; font-weight: extrabold; color: #333;">${mfaCode}</span>
            <p>To complete your login, enter this code in the required field. Note that this code will expire shortly, so be sure to use it as soon as possible.</p>
            <p>If you did not request this code or believe this message was sent in error, please contact our support team immediately at <a href="mailto:safePassVault@gmail.com">safePassVault@gmail.com</a>.</p>
            <p>Thank you for helping us keep your account secure.</p>
            <p>Best regards,<br>SafePassVault Team</p>
            <hr>
            <p style="font-size: 12px; color: #666;">
              This is an automated message, please do not reply to this email. For any assistance, contact our support.
            </p>
          `,
        };

        await sendEmail(mailOptions);

        res.status(200).send({
          message: "MFA code sent via email",
          mfaRequired: true,
          mfaMethod: user.mfaMethod,
        });
      }

      // Sending MFA code via SMS
      else if (user.mfaMethod === "sms") {
        try {
          // await sendSms(mfaCode, user);
          res.status(200).send({
            message: "MFA code sent via SMS",
            userId: user._id,
            mfaRequired: true,
            mfaMethod: user.mfaMethod,
          });
        } catch (error) {
          res.status(500).send({
            message: "Error sending MFA code via SMS",
            error: error.message,
          });
        }
      } else if (user.mfaMethod === "totp") {
        res.status(200).send({
          message: "TOTP MFA enabled",
          userId: user._id,
          mfaRequired: true,
          mfaMethod: user.mfaMethod,
        });
      } else if (user.mfaMethod === "webauthn") {
        // Return the WebAuthn challenge to the frontend
        const options = await generateAuthenticationOptions({
          rpID: "localhost",
          userVerification: false,
        });
        return res.status(200).send({
          message: "WebAuthn challenge required",
          mfaRequired: true,
          mfaMethod: "webauthn",
          challenge: options,
        });
      } else {
        res.status(400).send({ message: "Unsupported MFA method" });
      }
    } else {
      const token = user.generateAuthToken();
      res.status(200).send({ token });
    }
  } catch (error) {
    console.log(`Error in login controller: ${error.message} ${error.stack}`);

    res.status(400).send({ message: "Invalid email or password" });
  }
};

exports.resendConfirmationCode = async (req, res) => {
  const email = req.params.email;
  const user = await User.findOne({ email });
  if (!user) {
    return res.status(404).send({ message: "User not found" });
  }

  const confirmationCode = crypto.randomInt(100000, 999999).toString();
  user.confirmationCode = confirmationCode;

  const mailOptions = {
    from: "safePassVault@gmail.com",
    to: email,
    subject: "Your SafePassVault Verification Code",
    html: `
      <b>Hi ${user.name},</b>
      <p>Thank you for registering with SafePassVault! To complete your registration, please use the following verification code:</p>
      <p style="font-size: 18px; font-weight: bold; color: #333;">${confirmationCode}</p>
      <p>Enter this code in the required field to confirm your account. This code will expire soon, so please use it promptly.</p>
      <p>If you did not request this code or have any questions, feel free to reach out to us at 
      <a href="mailto:safePassVault@gmail.com">safePassVault@gmail.com</a>.</p>
      <p>Thank you,<br>The SafePassVault Team</p>
      <hr>
      <p style="font-size: 12px; color: #666;">
        This is an automated message. Please do not reply to this email. For assistance, contact our support team.
      </p>
    `,
  };

  await sendEmail(mailOptions);
  await user.save();
  res.status(201).send({
    message: `Resend Email Confirmation code send to your mail`,
  });
};

exports.sendMagicLink = async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    // Generate a one-time token with JWT (valid for 10 minutes)
    const token = jwt.sign({ email }, process.env.EMAIL_SECRET, {
      expiresIn: "10m",
    });

    // Generate a magic link URL (your frontend will handle the redirect)
    const magicLink = `${process.env.FRONTEND_URL}/auth/magic-link?token=${token}`;

    // Send magic link via email
    await sendEmail({
      from: "safepassvault@gmail.com",
      to: email,
      subject: "Your SafePassVault Magic Link",
      html: `<p>Click the link below to log in:</p><a href="${magicLink}">Login to SafePassVault</a>`,
    });

    res.status(200).json({ message: "Magic link sent to your email." });
  } catch (error) {
    res.status(500).json({ message: "Failed to send magic link." });
  }
};

// Step 2: Verify the Magic Link
exports.verifyMagicLink = async (req, res) => {
  const { token } = req.query;
  try {
    // Verify token and extract email
    const decoded = jwt.verify(token, process.env.EMAIL_SECRET);
    const user = await User.findOne({ email: decoded.email });
    if (!user) return res.status(404).json({ message: "User not found" });

    // Generate a session token to authenticate the user in your app
    const sessionToken = user.generateAuthToken();

    res.status(200).json({ token: sessionToken, message: "Login successful" });
  } catch (error) {
    res.status(400).json({ message: "Invalid or expired magic link" });
  }
};

exports.resendMagicLink = async (req, res) => {
  const { email } = req.body;
  try {
    // Validate user email exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).send({ message: "User not found" });
    }

    // Generate a new magic link token
    const expiresIn = "15m";

    // Generate a token with user ID as payload
    const token = jwt.sign(
      { userId: user._id },
      process.env.EMAIL_SECRET, // Use an environment variable for the secret key
      { expiresIn }
    );
    await sendMagicLinkEmail(email, token); // Use your email sending logic

    res.status(200).send({ message: "Magic link sent" });
  } catch (error) {
    res.status(500).send({ message: "Error resending magic link" });
  }
};

exports.saveSSOSettings = async (req, res) => {
  const {
    provider,
    loginUrl,
    redirectUrl,
    clientId,
    clientSecret,
    tenantId,
    secretExpiry,
    scopes,
    additionalSettings,
  } = req.body;

  try {
    const ssoSettings = await SSOSettings.findOneAndUpdate(
      { provider }, // Find by provider type to allow updates
      {
        provider,
        loginUrl,
        redirectUrl,
        clientId,
        clientSecret,
        tenantId,
        secretExpiry,
        scopes,
        additionalSettings,
      },
      { new: true, upsert: true } // Create if doesn't exist, otherwise update
    );

    res.status(200).json({
      message: `${provider} SSO settings saved successfully`,
      ssoSettings,
    });
  } catch (error) {
    console.error(`Error saving ${provider} SSO settings:`, error);
    res
      .status(500)
      .json({ message: `Failed to save ${provider} SSO settings`, error });
  }
};
// Step 1: Initiate account recovery
exports.initiateRecovery = async (req, res) => {
  try {
    const { email } = req.body;

    // Find the user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // Generate a temporary recovery token (valid for 15 minutes)
    const recoveryToken = crypto.randomBytes(32).toString("hex");
    user.recoveryToken = crypto
      .createHash("sha256")
      .update(recoveryToken)
      .digest("hex");
    user.recoveryTokenExpiry = Date.now() + 15 * 60 * 1000; // 15 minutes

    // Save the token and expiry to the user's record
    await user.save();

    // Send the recovery token to the user's email (mocked here)
    const mailOptions = {
      from: "safepassvault@gmail.com",
      to: email,
      subject: "Account Recovery - SafePassVault",
      html: `
        <p>Hello,</p>
        <p>We received a request to recover your SafePassVault account.</p>
        <p>Use the following recovery token to proceed:</p>
        <p style="font-weight: bold; font-size: 18px;">${recoveryToken}</p>
        <p>This token is valid for 15 minutes. If you did not request this, you can safely ignore this email.</p>
      `,
    };

    await sendEmail(mailOptions);

    return res
      .status(200)
      .json({ message: "Recovery email sent.", recoveryToken });
  } catch (error) {
    return res
      .status(500)
      .json({ message: `Error initiating recovery: ${error.message}` });
  }
};

// Step 2: Verify recovery token and encrypted recovery phrase
exports.verifyRecovery = async (req, res) => {
  try {
    const { email, recoveryToken, encryptedRecoveryPhrase, privateKeyPEM } =
      req.body;

    // Find the user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // Validate recovery token
    const hashedToken = crypto
      .createHash("sha256")
      .update(recoveryToken)
      .digest("hex");
    // Uncomment and adjust logic for token expiry
    if (
      user.recoveryToken !== hashedToken ||
      user.recoveryTokenExpiry < Date.now()
    ) {
      return res
        .status(400)
        .json({ message: "Invalid or expired recovery token." });
    }

    // Check if the private key is provided (You might want to store and retrieve private keys securely)
    if (!privateKeyPEM) {
      return res
        .status(400)
        .json({ message: "Private key is required for recovery." });
    }

    // Verify the decrypted recovery phrase with the stored signature
    const isVerified = crypto.verify(
      "sha256",
      Buffer.from(encryptedRecoveryPhrase),
      {
        key: user.publicKey, // Use the stored public key for verification
        padding: crypto.constants.RSA_PKCS1_PSS_PADDING,
      },
      Buffer.from(user.fingerPrint, "base64") // Fingerprint is stored as base64, so we decode it
    );

    if (!isVerified) {
      return res
        .status(400)
        .json({ message: "Recovery phrase verification failed." });
    }

    // Success: Allow the user to reset their password or perform other recovery actions
    return res.status(200).json({
      message:
        "Recovery verified successfully. You can now reset your account.",
      passphrase: encryptedRecoveryPhrase, // Optional: send only if necessary
    });
  } catch (error) {
    console.log("Error in recovery verification:", error);
    return res
      .status(500)
      .json({ message: `Error verifying recovery: ${error.message}` });
  }
};

exports.setUp2FA = async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  if (!user) {
    return res.status(404).send({ message: "User not found" });
  }

  // Generate a TOTP secret key for the user
  const secret = otplib.authenticator.generateSecret();
  await user.updateOne(
    {
      totpSecret: secret,
    },
    {
      new: true,
    }
  );
  // Generate a QR code that the user can scan with their authentication app
  const otpauth = otplib.authenticator.keyuri(email, "SafePassVault", secret);
  qrcode.toDataURL(otpauth, (err, imageUrl) => {
    if (err) {
      return res.status(500).send("Error generating QR code");
    }
    res.json({ imageUrl }); // Send QR code URL to the frontend
  });
};

// Verify TOTP (During Login)
exports.verify2FA = async (req, res) => {
  const { email, token } = req.body;

  const user = await User.findOne({ email });
  if (!user) {
    return res.status(404).send({ message: "User not found" });
  }
  console.log("token", token);
  console.log("token", user);

  // Verify the token generated by the authentication app
  const isValid = otplib.authenticator.verify({
    token,
    secret: user.totpSecret,
  });

  if (isValid) {
    res.send("2FA verified successfully");
  } else {
    res.status(400).send("Invalid token");
  }
};
let userPublicKey = null;
let challenge = null;

exports.createWebAuthRegisteration = async (req, res) => {
  try {
    // Assuming req.user contains the authenticated user information
    const user = await User.findById(req.user._id);
    const options = await generateRegistrationOptions({
      rpID: "localhost",
      rpName: "http://localhost:4200",
      attestationType: "none",
      userName: user.email,
      timeout: 30_000,
    });

    // Store the challenge in the user's profile (you need to handle this on the database)
    await User.findByIdAndUpdate(
      user._id,
      {
        $set: {
          webAuthnChallenge: options.challenge,
        },
      },
      {
        new: true,
      }
    );

    // Send the challenge and options to the frontend
    res.json({ challenge: options.challenge, options });
  } catch (err) {
    console.error("Error generating WebAuthn challenge:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.completeWebAuthRegisteration = async (req, res) => {
  try {
    const { credential } = req.body;

    if (!credential) {
      return res.status(400).json({ message: "Missing credential in request" });
    }
    console.log("Received credential from client: ", credential);

    // Retrieve the user by their WebAuthn client ID
    const user = await User.findById(req.user._id);

    if (!user) {
      return res
        .status(400)
        .json({ message: "User not found for WebAuthn client ID" });
    } else {
      console.log("User found: ", user);

      const verificationResult = await verifyRegistrationResponse({
        expectedChallenge: user.webAuthnChallenge,
        expectedOrigin: "http://localhost:4200",
        expectedRPID: "localhost",
        response: credential,
        requireUserVerification: false,
      });

      if (!verificationResult.verified)
        return res.json({ error: "could not verify" });
      await user.updateOne({
        $set: {
          passkeysForWebAuth: verificationResult.registrationInfo,
        },
      });
      res.json({ status: "Registration complete" });
    }
  } catch (err) {
    console.error("Error completing WebAuthn registration:", err);
    res
      .status(500)
      .json({ message: "Failed to complete WebAuthn registration" });
  }
};

exports.completeWebAuthnAuthentication = async (req, res) => {
  try {
    const { credential, challange, email } = req.body; // Get credential response and challange from frontend

    const user = await User.findOne({ email });

    if (!user) {
      return res
        .status(400)
        .json({ message: "User not found for WebAuthn client ID" });
    }

    // Decode the Base64 string to a binary string
    const binaryString = user.passkeysForWebAuth[0].credential.publicKey;
    const credentialPublicKey = new Uint8Array(binaryString.buffer);

    const result = await verifyAuthenticationResponse({
      expectedChallenge: challange.challenge,
      expectedOrigin: "http://localhost:4200",
      expectedRPID: "localhost",
      response: credential,
      credential: {
        id: user.passkeysForWebAuth[0].credential.id,
        publicKey: credentialPublicKey,
        counter: user.passkeysForWebAuth[0].credential.counter,
        transports: user.passkeysForWebAuth[0].credential.transports,
      },
      authenticator: {
        credentialPublicKey, // Correct Uint8Array instance
        counter: user.passkeysForWebAuth[0].credential.counter,
        transports: user.passkeysForWebAuth[0].credential.transports,
      },
      requireUserVerification: false,
    });
    if (result.verified) {
      // Successful authentication, generate token or any other action
      const token = user.generateAuthToken();
      return res
        .status(200)
        .json({ message: "MFA authentication successful", token });
    } else {
      return res
        .status(400)
        .json({ message: "WebAuthn authentication failed" });
    }
  } catch (err) {
    console.error("Error during WebAuthn authentication:", err);
    res
      .status(500)
      .json({ message: "Failed to complete WebAuthn authentication" });
  }
};
exports.verifysecurityPin = async(req, res) => {
  try{
    const { email,securityPin } = req.body;
    const user = await User.findOne({email:email})

    // Check if the user exists
    if (!user) {
        return res.status(404).json({ message: 'User  not found' });
    }

    // Verify the PIN
    if (user.securityPin === securityPin) {
        return res.status(200).json({ message: 'PIN verified successfully' });
    } else {
        return res.status(401).json({ message: 'Invalid PIN' });
    }
  }
  catch(error) {
    console.error("Error during PIN verification:", error);
    res.status(500).json({ message: 'Failed to verify PIN' });
  }
}
