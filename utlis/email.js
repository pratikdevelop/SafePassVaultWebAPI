const transporter = require('../config/emailconfig'); // Email configuration file

/**
 * Sends an email using the provided options.
 * @param {Object} mailOptions - Contains email details (from, to, subject, html).
 * @returns {Promise<void>} - A promise that resolves if the email is sent successfully.
 */
const sendEmail = async (mailOptions) => {
  try {
    await transporter.sendMail(mailOptions);
    
  } catch (error) {
    console.error("Error sending email:", error.message);
    throw new Error("Failed to send email");
  }
};

async function sendMagicLinkEmail(email, token) {
  // Define the magic link (adjust the URL as per your frontend's domain and route)
  const magicLinkUrl = `${process.env.FRONTEND_URL}/auth/magic-link?token=${token}&email=${encodeURIComponent(email)}`;

  // Define the email options
  const mailOptions = {
    from: process.env.EMAIL_USER, // Sender address
    to: email, // Recipient email
    subject: 'Your Magic Link for Login',
    html: `
      <h1>Login with Magic Link</h1>
      <p>Click the link below to login to your account:</p>
      <a href="${magicLinkUrl}">Login Now</a>
      <p>This link will expire in 15 minutes.</p>
    `,
  };

  // Send the email
  await transporter.sendMail(mailOptions);
}


module.exports = { sendEmail };
