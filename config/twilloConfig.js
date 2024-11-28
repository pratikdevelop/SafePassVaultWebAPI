// twilioClient.js

// Import the Twilio library
const twilio = require('twilio');

// Initialize the Twilio client with environment variables for account SID and auth token
const client = twilio(
    process.env.TWILIO_ACCOUNT_SID, // Twilio Account SID
    process.env.TWILIO_AUTH_TOKEN  // Twilio Auth Token
);
// console.log(client.api)


const sendSms = async (mfaCode, user) => {
    try {
        const message = await client.messages.create({
            body: `Your MFA code is: ${mfaCode}`,
            from: process.env.TWILIO_PHONE_NUMBER, // From a Twilio phone number (configured in your .env file)
            to: user.phone, // To the user's phone number
        });
        console.log('SMS sent successfully. SID:', message.sid);
        return message; // Return message details if needed
    } catch (error) {
        console.error('Error sending SMS:', error.message);
        throw error; // Rethrow error if needed to handle in other parts of the app
    }
};
// Export the Twilio client
module.exports = {
    client,
    sendSms
};
