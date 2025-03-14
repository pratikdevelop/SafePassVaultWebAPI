// models/Plan.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const FeatureSchema = new Schema({
  icon: { type: String, required: true },
  text: { type: String, required: true }
});

const PlanSchema = new Schema({
  paypalPlanId: { type: String, required: true }, // PayPal plan ID
  planName: { type: String, required: true },
  description: { type: String }, // Optional description
  amount: { type: Number, required: true }, // Amount in cents
  currency: { type: String, required: true, default: 'usd' },
  interval: { type: String, required: true }, // e.g., 'month', 'year'
  intervalCount: { type: Number, required: true, default: 1 }, // Number of intervals
  features: { type: [FeatureSchema], required: true }, // Array of feature objects
  buttonLink: { type: String, required: true }, // Link for the button
  buttonText: { type: String, required: true }, // Text for the button
  hasTrial: { type: Boolean, required: true }, // Trial availability
  queryParams: { type: Object, required: true }, // Object for query parameters
  trialLink: { type: String }, // Link for trial
  trialQueryParams: { type: Object }, // Object for trial query parameters
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});
module.exports = mongoose.model('Plan', PlanSchema);
