const mongoose = require('mongoose');
const subscriptionSchema = new mongoose.Schema({
  paypalSubscriptionId: { type: String }, // Updated for PayPal
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Link to the user
  plan: { type: String, required: true }, // Subscription plan type (e.g., basic, premium)
  subscriptionStatus: { type: String, required: true }, // Active, canceled, etc.
  subscriptionExpiry: { type: Date }, // Expiry date of the subscription
  subscriptionStart: { type: Date }, // Start date of the subscription
  subscriptionEnd: { type: Date }, // End date of the subscription (if applicable)
  trialEndDate: { type: Date }, // Trial end date (if applicable)
  planAction: { type: String }, // Action taken on the plan (e.g., created, updated)
});

module.exports = subscriptionSchema;
