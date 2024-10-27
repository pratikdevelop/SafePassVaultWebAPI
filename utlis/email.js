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

module.exports = { sendEmail };
