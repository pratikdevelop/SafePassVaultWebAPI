const mongoose = require('mongoose');

const addressSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    name: { type: String, required: true },
    folder: { type: String, default: null },
    title: { type: String, default: null },
    firstName: { type: String, default: null },
    middleName: { type: String, default: null },
    lastName: { type: String, default: null },
    username: { type: String, default: null },
    gender: { type: String, enum: ['Male', 'Female', 'Other'], default: null },
    birthday: { type: Date, default: null },
    company: { type: String, default: null },
    address1: { type: String, default: null },
    address2: { type: String, default: null },
    city: { type: String, default: null },
    county: { type: String, default: null },
    state: { type: String, default: null },
    zipCode: { type: String, default: null },
    country: { type: String, default: null },
    timezone: { type: String, default: null },
    email: { type: String, default: null },
    phone: { type: String, default: null },
    phoneExtension: { type: String, default: null },
    eveningPhone: { type: String, default: null },
    eveningPhoneExtension: { type: String, default: null },
    advancedSettings: {
        attachments: [
            {
                name: { type: String },
                path: { type: String }
            }
        ]
    }
}, {
    timestamps: true // Adds createdAt and updatedAt fields
});

const Address = mongoose.model('Address', addressSchema);

module.exports = Address;
