const nodemailer = require('nodemailer');

// Create a transporter object with your email service credentials
const transporter = nodemailer.createTransport({
  service: 'Gmail', // Replace with your email provider (e.g., Gmail, Outlook, etc.)
  auth: {
    user: process.env.EMAIL_USERNAME, // Your email address from environment variable
    pass: process.env.EMAIL_PASSWORD, // Your email password from environment variable
  },
  // Additional options can be added, like `port`, `secure`, etc.
  tls: {
    rejectUnauthorized: false, // This option can be set to `false` if you're testing with self-signed certificates
  },
});

// Verify the connection configuration
transporter.verify((error, success) => {
  if (error) {
    console.error('Error in email transporter configuration:', error);
  } else {
    console.log('Email transporter is ready to send messages');
  }
});

// Export the transporter for use in other files
module.exports = transporter;
