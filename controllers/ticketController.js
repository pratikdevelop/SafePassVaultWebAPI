const express = require("express");
const router = express.Router();
const axios = require("axios");
const Ticket = require("../model/ticket"); // Import the Ticket model
const User = require("../model/user");

// Jira Configuration
const JIRA_BASE_URL = process.env.JIRA_BASE_URL;
const JIRA_PROJECT_KEY = process.env.JIRA_PROJECT_KEY;
const JIRA_AUTH_TOKEN = process.env.JIRA_AUTH_TOKEN
const email = process.env.MONGO_INITDB_ROOT_USERNAME;

// Controller Functions

const createTicket = async (req, res) => {
  try {
    const {
      category,
      categorySubtype,
      description,
      priority,
      severity,
      attachments,
      fixVersionId,
      issueTypeId,
      reporterId,
      dueDate,
      labels,
      parentTicketKey,
      environment,
      customFields, // To handle custom fields dynamically
    } = req.body;

    const userId = req.user._id;
    const user = await User.findById(userId);
    // Create and save the new ticket in your DB
    const newTicket = new Ticket({
      name: user.name,
      email: user.email,
      userId: req.user._id,
      category,
      categorySubtype,
      description,
      priority,
      severity,
      attachments,
      userAgent: req.headers["user-agent"],
    });

    await newTicket.save();

    // // Prepare data for JIRA issue creation
    const jiraIssueData = {
      fields: {
        project: {
          key: "KAN", // Use the correct project key (e.g., "KAN" or the correct project ID)
        },
        summary: "Ticket: linku user",
        description:
          "Category: general-feedback\nSubtype: jjlkjlkjklj\nDescription: lkkljlkj\nPriority: Medium\nSeverity: Moderate\nUser Email: linku@mailinator.com",
        issuetype: {
          name: 'Task',
        },
        labels: ["bugfix", "blitz_test"], // Remove empty label or use valid labels
        reportter: {
          name: user.name,
        },
      },
    };

    // Send the request to JIRA to create the issue
    fetch(
      `${JIRA_BASE_URL}/rest/api/2/issue`, // Make sure JIRA_BASE_URL is defined in your environment

      {
        headers: {
          Authorization: `Basic ${Buffer.from(
            `${email}:${process.env.JIRA_AUTH_TOKEN}`
          ).toString("base64")}`,
          Accept: "application/json",
          "Content-Type": "application/json",
        },

        method: "POST",
        body: JSON.stringify(jiraIssueData),
      }
    )
      .then((response) => {
        return response.json();
      })
      .then((data) => {
        console.log(data);
        res.status(201).json({
          success: true,
          message: "Ticket created successfully and added to Jira",
          ticket: newTicket,
          jiraIssue: data.data,
        });
      })


      .catch((error) => {
        console.error(error.data);
        res.status(500).json({
          success: false,
          message: "Failed to create ticket in Jira",
          error: error,
        });
      });
  } catch (error) {
    console.error("Error creating ticket:", JSON.stringify(error));
    res.status(500).json({
      success: false,
      message: "Error creating ticket",
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
      message: "Error fetching tickets",
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
        message: "Ticket not found",
      });
    }

    res.status(200).json({
      success: true,
      ticket,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching ticket",
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
        message: "Ticket not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Ticket updated successfully",
      ticket,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error updating ticket",
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
        message: "Ticket not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Ticket deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error deleting ticket",
      error: error.message,
    });
  }
};

module.exports = {
  createTicket,
  getAllTickets,
  getTicketById,
  updateTicket,
  deleteTicket,
};
