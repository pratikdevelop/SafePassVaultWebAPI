const express = require('express');
const router = express.Router();
const axios = require('axios');
const Ticket = require('../models/Ticket'); // Import the Ticket model

// Jira Configuration
const JIRA_BASE_URL = 'https://your-domain.atlassian.net';
const JIRA_PROJECT_KEY = 'YOUR_PROJECT_KEY';
const JIRA_AUTH_TOKEN = 'Basic YOUR_ENCODED_API_TOKEN';

// Controller Functions

// Create a new ticket
const createTicket = async (req, res) => {
  try {
    const {
      name,
      email,
      category,
      categorySubtype,
      description,
      priority,
      severity,
      attachments,
      userAgent,
    } = req.body;

    const newTicket = new Ticket({
      name,
      email,
      category,
      categorySubtype,
      description,
      priority,
      severity,
      attachments,
      userAgent: req.headers['user-agent'],
    });

    await newTicket.save();

    // Create a Jira issue
    const jiraIssueData = {
      fields: {
        project: {
          key: JIRA_PROJECT_KEY,
        },
        summary: `Ticket: ${name}`,
        description: `Category: ${category}\nSubtype: ${categorySubtype}\nDescription: ${description}\nPriority: ${priority}\nSeverity: ${severity}\nUser Email: ${email}`,
        issuetype: {
          name: 'Task', // Adjust issue type as per your Jira setup
        },
        priority: {
          name: priority || 'Medium',
        },
      },
    };

    const jiraResponse = await axios.post(
      `${JIRA_BASE_URL}/rest/api/2/issue`,
      jiraIssueData,
      {
        headers: {
          Authorization: JIRA_AUTH_TOKEN,
          'Content-Type': 'application/json',
        },
      }
    );

    res.status(201).json({
      success: true,
      message: 'Ticket created successfully and added to Jira',
      ticket: newTicket,
      jiraIssue: jiraResponse.data,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating ticket',
      error: error.message,
    });
  }
};

// Get all tickets
const getAllTickets = async (req, res) => {
  try {
    const tickets = await Ticket.find();
    res.status(200).json({
      success: true,
      tickets,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching tickets',
      error: error.message,
    });
  }
};

// Get a single ticket by ID
const getTicketById = async (req, res) => {
  try {
    const { id } = req.params;
    const ticket = await Ticket.findById(id);

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found',
      });
    }

    res.status(200).json({
      success: true,
      ticket,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching ticket',
      error: error.message,
    });
  }
};

// Update a ticket
const updateTicket = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const ticket = await Ticket.findByIdAndUpdate(id, updates, { new: true });

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Ticket updated successfully',
      ticket,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating ticket',
      error: error.message,
    });
  }
};

// Delete a ticket
const deleteTicket = async (req, res) => {
  try {
    const { id } = req.params;
    const ticket = await Ticket.findByIdAndDelete(id);

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Ticket deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting ticket',
      error: error.message,
    });
  }
};


module.exports = {
    createTicket,
    getTickets,
    getTicket,
    updateTicket,
    deleteTicket
    
}
