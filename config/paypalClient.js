const PayaplAPI = require('paypal-server-api');
const paypalserver = require('@paypal/checkout-server-sdk');

let paypal = null;

async function getClient() {
  if (!paypal) {
    paypal = new PayaplAPI({
      clientId: process.env.PAYPAL_CLIENT_ID, // Your PayPal client ID
      secret: process.env.PAYPAL_CLIENT_SECRET, // Your PayPal secret
      log: true, // Log some information to the console
    });
    await paypal.authenticate();

  }
  return paypal;
}

getClient().then(()=>{})

function environment() {
  return new paypalserver.core.SandboxEnvironment(
    process.env.PAYPAL_CLIENT_ID,
    process.env.PAYPAL_CLIENT_SECRET
  );
}

// Create a PayPal client
function paypalClient() {
  return new paypalserver.core.PayPalHttpClient(environment());
}


module.exports = {paypal, paypalClient};