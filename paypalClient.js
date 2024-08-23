// paypalClient.js
const paypal = require('@paypal/checkout-server-sdk');

// Create an environment
function environment() {
  return new paypal.core.SandboxEnvironment(
    process.env.PAYPAL_CLIENT_ID,
    process.env.PAYPAL_CLIENT_SECRET
  );
}

// Create a PayPal client
function client() {
  return new paypal.core.PayPalHttpClient(environment());
}

module.exports = { client };
