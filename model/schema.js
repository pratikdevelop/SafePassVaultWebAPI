const researchSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  researchTitle: String,
  researchDetails: String,
  filesUrl: [String], // URLs to research-related files
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Research', researchSchema);


const clientSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  clientName: String,
  contactInfo: {
    phone: String,
    email: String,
    address: String
  },
  details: String,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Client', clientSchema);

const expenseSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  category: String,
  amount: Number,
  date: Date,
  receiptUrl: String, // URL to the encrypted receipt or invoice
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Expense', expenseSchema);

const eventSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  eventName: String,
  date: Date,
  location: String,
  details: String,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Event', eventSchema);

const emergencyContactSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  name: String,
  relationship: String,
  phone: String,
  email: String,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('EmergencyContact', emergencyContactSchema);

const personalContactSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  name: String,
  phone: String,
  email: String,
  address: String,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('PersonalContact', personalContactSchema);

const educationSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  type: String, // e.g., diploma, transcript
  institution: String,
  details: String,
  fileUrl: String, // URL to the encrypted education record
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Education', educationSchema);

const iotDeviceSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  deviceName: String,
  credentials: String, // Encrypted credentials for IoT devices
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('IoTDevice', iotDeviceSchema);

const subscriptionSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  service: String,
  renewalDate: Date,
  paymentMethod: String,
  fileUrl: String, // URL to the encrypted subscription document
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Subscription', subscriptionSchema);

const businessCredentialSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  type: String, // e.g., business license, incorporation
  details: String,
  fileUrl: String, // URL to the encrypted business document
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('BusinessCredential', businessCredentialSchema);

const legalDocumentSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  type: String, // e.g., will, power of attorney
  details: String,
  fileUrl: String, // URL to the encrypted legal document
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('LegalDocument', legalDocumentSchema);

const travelSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  itinerary: String,
  bookingReference: String,
  fileUrl: String, // URL to the encrypted travel document
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Travel', travelSchema);

const insuranceSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  type: String, // e.g., health, auto
  policyNumber: String,
  provider: String,
  fileUrl: String, // URL to the encrypted insurance policy
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Insurance', insuranceSchema);

const financialSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  type: String, // e.g., bank account, credit card
  accountNumber: String,
  bankName: String,
  fileUrl: String, // URL to the encrypted financial document
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Financial', financialSchema);

const healthRecordSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  type: String, // e.g., vaccination, medical history
  details: String,
  fileUrl: String, // URL to the encrypted health record
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('HealthRecord', healthRecordSchema);
