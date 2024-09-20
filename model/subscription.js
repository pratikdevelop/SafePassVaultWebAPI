const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
  stripeCustomerId: { type: String },
  plan: { type: String },
  subscriptionStatus: { type: String },
  subscriptionExpiry: { type: Date },
  subscriptionStart: { type: Date },
  subscriptionEnd: { type: Date },
  subscriptionId: {
    type: String,
  },
  trialEndDate: {
    type: Date,
  },
  planToken: {
    type: String,
  },
  planAction: {
    type: String,
  },
});

module.exports = subscriptionSchema;
