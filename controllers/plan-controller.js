const client = require("../paypalClient");

const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
  const Plan = require('../model/plan'); // Adjust the path as necessary

exports.getPlans = async (req, res) => {
  try {
    // Fetch all plans from the MongoDB database
    const plans = await Plan.find();


    // Format the plans for the response
    const formattedPlans = plans.map(plan => ({
      id: plan.paypalPlanId,
      title: plan.planName,
      amount: plan.amount / 100, // Convert cents to dollars
      currency: plan.currency,
      interval: plan.interval,
      intervalCount: plan.intervalCount,
      features: plan.features,
      buttonLink: plan.buttonLink,
      buttonText: plan.buttonText,
      hasTrial: plan.hasTrial,
      queryParams: plan.queryParams,
      trialLink: plan.trialLink,
      trialQueryParams: plan.trialQueryParams,
    }));


    // Send the formatted plan data as a JSON response
    res.status(200).json({ plans: formattedPlans });
  } catch (error) {
    console.error('Error fetching plans from database:', error);
    // Send an error response with a status code and message
    res.status(500).json({ message: 'Unable to fetch plans.', error: error.message });
  }
};

  

exports.createPayment = async (req, res) => {
  console.log();
  
    try {
      const { token, planId } = req.body;
      
      const parseToken =  JSON.stringify(token) 
      console.log('rr', parseToken);
      
      // Create a payment method
      const paymentMethod = await stripe.paymentMethods.create({
        type: 'card',
        card: { token: parseToken},
      });
  
      // Create a customer
      const customer = await stripe.customers.create({
        payment_method: paymentMethod.id,
        invoice_settings: {
          default_payment_method: paymentMethod.id,
        },
      });
  
      // Create a subscription
      const subscription = await stripe.subscriptions.create({
        customer: customer.id,
        items: [{ price: planId }],
        expand: ['latest_invoice.payment_intent'],
      });
  
      const paymentIntent = subscription.latest_invoice.payment_intent;
  
      if (paymentIntent.status === 'requires_action' || paymentIntent.status === 'requires_payment_method') {
        return res.status(400).send({
          requiresAction: true,
          clientSecret: paymentIntent.client_secret,
          message: "Further authentication required to complete payment.",
        });
      }
  
      if (paymentIntent.status !== 'succeeded') {
        console.log('paymentIntent', paymentIntent);
        return res.status(400).send({ message: "Payment failed, please try again." });
      }
  
      res.status(201).send({ message: "Payment successful" });
    } catch (error) {
      console.error('Error creating payment:', error);
      res.status(400).send({ message: `Error creating payment: ${error.message}` });
    }
};

exports.getStripePlanDetails = async (planId) => {
  try {
    const plan = await stripe.plans.retrieve(planId);
    const product = await stripe.products.retrieve(plan.product) 
    return {plan, product};
  } catch (error) {
    console.error('Error fetching Stripe plan details:', error);
    throw error;
  }
};