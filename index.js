require("dotenv").config();
require("./config/conn");

const express = require("express");
const app = express();
const cors = require("cors");
const password = require("./routes/passwordRoutes");
const users = require("./routes/userRoutes");
const tagRoutes = require("./routes/tagRoutes");
const noteController = require("./routes/noteRoutes");
const proofIdsController = require('./routes/proofIdRoutes');
const cardControlller = require('./routes/cardRoutes');
const securityQuestionRoutes = require('./routes/securityQuestionRoutes');
const fileRoutes = require('./routes/fileRoutes');
const shareItemRoutes = require('./routes/shareItemRoutes');
const planRoutes = require('./routes/plan-routes');
const logRoutes = require('./routes/logRoutes');
const auth = require("./middleware");
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');
const ssoRoutes = require('./routes/ssoRoutes');
const secretRoutes = require('./routes/secretRoutes');
const auditRoutes = require('./routes/auditRoutes');
const invitationRoutes = require('./routes/invitiationRoutes');
const organizationRoutes = require('./routes/organizationRoutes');
const folderRoutes = require('./routes/folderRoutes');
const addressRoutes = require('./routes/addressRoutes');
const ticketRoutes = require('./routes/ticketRoutes');
const helmet = require('helmet');  // Import Helmet
const rateLimit = require("express-rate-limit");  // Import express-rate-limit
const port = process.env.PORT || 8000;

// Use Helmet for security headers
app.use(helmet());

// CORS configuration for local and live domains
const corsOptions = {
  origin: ['http://localhost:4200', 'https://safepassvault.co.in'], // Allow localhost and live domain
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
};
app.use(cors());

app.use((req, res, next) => {
  // Correctly format the Content-Security-Policy header as a single line
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self'; connect-src 'self' http://localhost:3000 https://vixol72czg.execute-api.us-east-1.amazonaws.com; script-src 'self' 'unsafe-inline' https://vixol72czg.execute-api.us-east-1.amazonaws.com; style-src 'self' 'unsafe-inline' https://vixol72czg.execute-api.us-east-1.amazonaws.com; img-src 'self' https://vixol72czg.execute-api.us-east-1.amazonaws.com; font-src 'self' https://fonts.gstatic.com;"
  );

  // Other security headers
  res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Permissions-Policy", "geolocation=(), microphone=(), camera=()");

  next();
});


app.get("/", (req, res) => {
  res.send("Hello World");
});

app.use(express.json());
app.use(auth);
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again later.",  // Custom message
  standardHeaders: true,  // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false,  // Disable the `X-RateLimit-*` headers
});

// Apply the rate limiter globally (for all routes)
app.use(globalLimiter);

// Bod
// Define your routes
app.use('/api/addresses', addressRoutes);
app.use('/api/folders', folderRoutes);
app.use('/api/swagger', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use("/api/auth", users);
app.use("/api/passwords", password);
app.use("/api/tags", tagRoutes);
app.use("/api/notes", noteController);
app.use("/api/proofIds", proofIdsController);
app.use("/api/cards", cardControlller);
app.use('/api/security-questions', securityQuestionRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/share', shareItemRoutes);
app.use('/api/plans', planRoutes);
app.use('/api/logs', logRoutes);
app.use('/api/secrets', secretRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/invitation', invitationRoutes);
app.use('/api/organization', organizationRoutes);
app.use('/api/sso-settings', ssoRoutes);
app.use('/api/tickets', ticketRoutes);

// Start the server
app.listen(port, () => {
  console.log(`Server started on port ${port}`);
});