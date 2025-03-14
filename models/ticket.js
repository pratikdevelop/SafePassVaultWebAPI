const mongoose = require('mongoose');
 const ticketSchema = new mongoose.Schema({
   ticketId: {
     type: String,
     unique: true,
     default: () => `TICKET-${Date.now()}`,
   },
   name: String,
   email: String,
   category: String,
   categorySubtype: String,
   description: String,
   userId: {
     type: mongoose.Schema.ObjectId,
     ref: 'User',
   },
   priority: {
     type: String,
     enum: ["Low", "Medium", "High"],
     default: "Medium",
   },
   severity: {
     type: String,
     enum: ["Minor", "Moderate", "Critical"],
     default: "Moderate",
   },
   status: {
     type: String,
     default: "Open",
     enum: ["Open", "In Progress", "Resolved", "Closed"],
   },
   assignee: String,
   resolutionNotes: String,
   attachments: [String],
   userAgent: String,
   relatedTickets: [{ type: mongoose.Schema.Types.ObjectId, ref: "Ticket" }],
   createdAt: { type: Date, default: Date.now },
   updatedAt: { type: Date, default: Date.now },
 });
 
 ticketSchema.pre("save", function (next) {
   this.updatedAt = Date.now();
   next();
 });
 
 const Ticket = mongoose.model("Ticket", ticketSchema);
 module.exports = Ticket;