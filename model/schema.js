// models/Plan.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const PlanSchema = new Schema({
  planId: { type: String, required: true, unique: true },
  planName: { type: String, required: true },
  description: { type: String },
  amount: { type: Number, required: true }, // Amount in cents
  currency: { type: String, required: true, default: 'usd' },
  interval: { type: String, required: true }, // e.g., 'month', 'year'
  stripePlanId: { type: String, required: true }, // Stripe plan ID
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Plan', PlanSchema);
