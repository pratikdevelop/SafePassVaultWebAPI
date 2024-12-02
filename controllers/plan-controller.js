// const { paypalClient } = require("../config/paypalClient");
const Subscription = require('../model/subscription')
// const paypal = require('@paypal/checkout-server-sdk')
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
    // Send an error response with a status code and message
    res.status(500).json({ message: 'Unable to fetch plans.', error: error.message });
  }
};



exports.createSubscriptions = async (req, res) => {
  // const { userId, plan, paypalOrderId } = req.body;

  // // Verify the order details and create the subscription
  // const request = new paypal.orders.OrdersGetRequest(paypalOrderId);

  // try {
  //   const response = await paypalClient().execute(request);
  //   const order = response.result;

  //   // Here, validate order amount, status, etc.
  //   if (order.status === 'COMPLETED') {
  //     const newSubscription = new Subscription({
  //       userId,
  //       plan: plan.title,
  //       paypalSubscriptionId: order.id, // Store PayPal order ID or subscription ID as needed
  //       subscriptionStatus: order.status,
  //       subscriptionStart: new Date(),
  //       subscriptionExpiry: calculateExpiryDate(),
  //     });

  //     await newSubscription.save();
  //     res.status(201).json({
  //       message: 'Subscription created successfully.',
  //       subscriptionId: newSubscription.id,
  //     });
  //   } else {
  //     res.status(400).json({ error: 'Order not completed' });
  //   }
  // } catch (error) {
  //   res.status(500).json({ error: error.message });
  // }
};

// Helper function to calculate the subscription expiry date
function calculateExpiryDate() {
  const expiryDate = new Date();
  expiryDate.setMonth(expiryDate.getMonth() + 1); // Assuming monthly subscriptions
  return expiryDate;
}

exports.getPlanDetails = async (planId) => {
  try {
    // Find the subscription plan associated with the user (using planId)
    const subscriptionPlan = await Subscription.findOne({ userId: planId });

    if (!subscriptionPlan) {
      throw new Error('Subscription plan not found.');
    }

    // Find the plan details based on the plan name
    const planDetails = await Plan.findOne({
      planName: subscriptionPlan.plan
    });

    if (!planDetails) {
      throw new Error('Plan details not found.');
    }

    // Merge subscriptionPlan and planDetails objects into a new object
    const newPlan = {
      ...subscriptionPlan.toObject(), // Ensure it's a plain object (in case it's a Mongoose document)
      ...planDetails.toObject() // Same for planDetails
    };

    return newPlan;
  } catch (error) {
    console.error('Error fetching plan details:', error.message);
    throw error;
  }
};
