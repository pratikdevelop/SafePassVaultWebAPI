// // models/Secret.js

const mongoose = require("mongoose");
const crypto = require("crypto");

// Define the Secret schema
const secretSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
        },
        type: {
            type: String,
            default: "",
        },
        value: {
            type: String,
        },
        description: {
            type: String,
            default: "",
        },
        format: {
            type: String,
            default: "text",
        },
        encrypt: {
            type: Boolean,
            default: false,
        },
        category: {
            type: String,
            default: "",
        },
        expirationDate: {
            type: Date,
            default: null,
        },
        createdBy: {
            type: mongoose.Schema.ObjectId,
            ref: "User",
        },
        createdDate: {
            type: Date,
            default: Date.now,
        },
        file: {
            type: String,
            default: "",
        },
        tags: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: "Tag",
        }],
        keyValuePairs: [
            {
                key: {
                    type: String,
                    required: true,
                },
                value: {
                    type: String,
                    required: true,
                },
            },
        ],
        jsonValue: {
            type: String,
            default: "",
        },
        folderId: {
            // New field to associate with a folder
            type: mongoose.Schema.Types.ObjectId,
            ref: "Folder",
            required: true, // Make it required if every password must belong to a folder
        },
    },
    {
        timestamps: true, // Automatically manage createdAt and updatedAt
    }
);

const Secret = mongoose.model("Secret", secretSchema);

module.exports = Secret;
