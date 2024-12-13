// API Routes
const express = require("express");
const router = express.Router();
const ticketController = require('../controllers/ticketController')
router.post('', ticketController.createTicket); // Create a ticket
router.get('', ticketController.getAllTickets); // Get all tickets
router.get(':id', ticketController.getTicketById); // Get a single ticket by ID
router.put(':id', ticketController.updateTicket); // Update a ticket
router.delete(':id', ticketController.deleteTicket); // Delete a ticket

module.exports = router;