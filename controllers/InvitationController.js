const User = require("../models/user");
const Organization = require("../models/Organization");
const Invitation = require("../models/Invitation");

exports.sendInvitation = async (req, res) => {
    const organizationId = req.params.organizationId;
    const { email, phone, name } = req.body;

    try {
        // Find the organization by ID
        const organization = await Organization.findById(organizationId);
        if (!organization) {
            return res.status(404).json({ message: "Organization not found" });
        }

        // Find the sender (current logged-in user)
        const sender = await User.findById(req.user._id);

        // Create a new recipient user with the provided email, name, and phone
        const recipient = new User({
            email,
            name,
            phone: parseInt(phone),
            role: "user",
        });

        // Save the recipient user to the database
        await recipient.save();

        // Add the recipient to the organization's members array
        organization.members.push(recipient._id);
        await organization.save(); // Save the updated organization

        // Create a new invitation with the sender and recipient details
        const invitation = new Invitation({
            sender: req.user._id,
            recipient: recipient._id,
            organization: organization._id,
        });

        // Save the invitation to the database
        await invitation.save();

        // Add the invitation ID to the sender's invitation list
        sender.invitation.push(invitation._id);
        await sender.save();

        // Send email invitation
        const mailOptions = {
            from: "safePassVault@gmail.com",
            to: recipient.email,
            subject: "You're Invited to Join ${organization.name} on SafePassVault",
            html: `
        <b>Hi ${recipient.name},</b>
        <p>${sender.name} has invited you to join the organization <strong>'${organization.name}'</strong> on SafePassVault.</p>
        <p>To accept this invitation and complete your account setup, please click the link below:</p>
        <p>
          <a href=${process.env.FRONTEND_URL}/auth/accept-invitation?id=${invitation._id}
             style="font-size: 16px; color: #4CAF50; text-decoration: none;">
             Accept Invitation
          </a>
        </p>
        <p>If the above link doesn’t work, you can copy and paste the following URL into your browser:</p>
        <p${process.env.FRONTEND_URL}/auth/accept-invitation?id=${invitation._id}</p>
        <p>If you have any questions or did not expect this invitation, please reach out to our support team at 
        <a href="mailto:safePassVault@gmail.com">safePassVault@gmail.com</a>.</p>
        <p>Thanks,<br>The SafePassVault Team</p>
        <hr>
        <p style="font-size: 12px; color: #666;">
          This is an automated message, please do not reply to this email. For any assistance, contact our support.
        </p>
      `,
        };

        // Send the email using the configured transporter
        await sendEmail(mailOptions);

        res.status(200).json({ message: "Invitation sent successfully" });
    } catch (error) {
        res.status(500).json({ message: "Error sending invitation" });
    }
};

exports.resendInvitation = async (req, res) => {
    const organizationId = req.params.organizationId;
    const recipientId = req.params.recipientId;

    try {
        // Find the organization
        const organization = await Organization.findById(organizationId);
        if (!organization) {
            return res.status(404).json({ message: "Organization not found" });
        }

        // Find the existing invitation
        const invitation = await Invitation.findOne({
            organization: organization._id,
            recipient: recipientId,
        });

        if (!invitation) {
            return res.status(404).json({ message: "Invitation not found" });
        }

        // Find the sender and recipient details
        const sender = await User.findById(invitation.sender);
        const recipient = await User.findById(recipientId);

        if (!sender || !recipient) {
            return res.status(404).json({ message: "Sender or recipient not found" });
        }

        // Resend the invitation email
        const mailOptions = {
            from: "safePassVault@gmail.com",
            to: recipient.email,
            subject: "You're Invited to Join ${organization.name} on SafePassVault",
            html: `
        <b>Hi ${recipient.name},</b>
        <p>${sender.name} has invited you to join the organization <strong>'${organization.name}'</strong> on SafePassVault.</p>
        <p>To accept this invitation and set up your account, please click the link below:</p>
        <p>
          <a href="${process.env.FRONTEND_URL}/auth/accept-invitation?id=${invitation._id}" 
             style="font-size: 16px; color: #4CAF50; text-decoration: none;">
             Accept Invitation
          </a>
        </p>
        <p>If the link above does not work, you can copy and paste the following URL into your browser:</p>
        <p>${process.env.FRONTEND_URL}/auth/accept-invitation?id=${invitation._id}</p>
        <p>If you have any questions or did not expect this invitation, please contact our support team at 
        <a href="mailto:safePassVault@gmail.com">safePassVault@gmail.com</a>.</p>
        <p>Thank you,<br>The SafePassVault Team</p>
        <hr>
        <p style="font-size: 12px; color: #666;">
          This is an automated message. Please do not reply to this email. For assistance, contact our support team.
        </p>
      `,
        };

        await sendEmail(mailOptions);

        res.status(200).json({ message: "Invitation resent successfully" });
    } catch (error) {
        res.status(500).json({ message: "Error resending invitation" });
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
        await User.findByIdAndUpdate(invitation.recipient, {
            password: hashedPassword,
            confirmationCode: confirmationCode,
        });

        // Mark the invitation as accepted
        invitation.status = "accepted";
        await invitation.save();

        // Generate a verification code

        // Send the verification code via email
        const mailOptions = {
            from: "safePassVault@gmail.com",
            to: invitation.recipient.email,
            subject: "Your SafePassVault Verification Code",
            html: `
        <b>Hi ${invitation.recipient.name},</b>
        <p>Your invitation to SafePassVault has been accepted!</p>
        <p>To complete the setup, please use the following verification code:</p>
        <p style="font-size: 18px; font-weight: bold; color: #333;">${confirmationCode}</p>
        <p>Enter this code in the required field to finish the process. This code will expire soon, so please use it promptly.</p>
        <p>If you have any questions or did not expect this invitation, please reach out to our support team at <a href="mailto:safePassVault@gmail.com">safePassVault@gmail.com</a>.</p>
        <p>Thank you,<br>SafePassVault Team</p>
        <hr>
        <p style="font-size: 12px; color: #666;">
          This is an automated message, please do not reply to this email. For assistance, contact our support.
        </p>
      `,
        };
        await sendEmail(mailOptions);

        res.status(200).json({
            message: "Invitation accepted and verification code sent successfully",
        });
    } catch (error) {
        res.status(500).json({ message: "Error accepting invitation" });
    }
};

exports.getAllUsers = async (req, res) => {
    try {
        // Get the current user ID from the request
        const userId = req.user._id;

        // Find all invitations where the sender is the current user
        const invitations = await Invitation.find({ sender: userId })
            .populate({
                path: "recipient",
                select: "name email phone",
            })
            .select("status organization createdAt")
            .exec();
        // Send the invitations as the response
        res.status(200).json({ invitations });
    } catch (error) {
        res.status(500).json({ message: "Error retrieving invitations" });
    }
};
