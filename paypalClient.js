
const Payapl = require('paypal-server-api');
const paypal = new Payapl({
  clientId: process.env.PAYPAL_CLIENT_ID, // Your PayPal client ID
  secret: process.env.PAYPAL_CLIENT_SECRET, // Your PayPal secret
  log: true, // Log some information to the console
})
async function client() {



return await paypal.authenticate();
}
client().then((res)=>{
  console.log(res);
})

module.exports =  paypal;
