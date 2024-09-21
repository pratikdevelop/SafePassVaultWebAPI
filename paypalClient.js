const Payapl = require('paypal-server-api');
let paypal = null;

async function getClient() {
  if (!paypal) {
    paypal = new Payapl({
      clientId: process.env.PAYPAL_CLIENT_ID, // Your PayPal client ID
      secret: process.env.PAYPAL_CLIENT_SECRET, // Your PayPal secret
      log: true, // Log some information to the console
    });
    await paypal.authenticate();

  }
  return paypal;
}

getClient().then(()=>{})

module.exports = paypal;