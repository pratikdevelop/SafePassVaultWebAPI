// API Routes
const express = require("express");
const router = express.Router();
const ticketController = require('../controllers/ticketController')
router.post('/tickets', ticketController.createTicket); // Create a ticket
router.get('/tickets', ticketController.getTickets); // Get all tickets
router.get('/tickets/:id', ticketController.getTicket); // Get a single ticket by ID
router.put('/tickets/:id', ticketController.updateTicket); // Update a ticket
router.delete('/tickets/:id', ticketController.deleteTicket); // Delete a ticket

module.exports = router;