// server.js
require("dotenv").config()
require("./config/conn")

const express = require("express");
const app = express();
const cors = require("cors");
const password = require("./routes/passwordRoutes")
const users = require("./routes/userRoutes")
const tagRoutes = require("./routes/tagRoutes")
const noteController = require('./routes/noteRoutes')
const proofIdsController = require('./routes/proofIdRoutes')
const cardControlller = require('./routes/cardRoutes')
const securityQuestionRoutes = require('./routes/securityQuestionRoutes')
const fileRoutes = require('./routes//fileRoutes')
const shareItemRoutes = require('./routes/shareItemRoutes')
const planRoutes = require('./routes/plan-routes')
const logRoutes = require('./routes/logRoutes')
const auth = require("./middleware")
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger')
const ssoRoutes = require('./routes/ssoRoutes');
const secretRoutes = require('./routes/secretRoutes');
const auditRoutes = require('./routes/auditRoutes');
const invitationRoutes = require('./routes/invitiationRoutes');
const organizationRoutes = require('./routes/organizationRoutes')
const folderRoutes = require('./routes/folderRoutes'); // Adjust the path as necessary
const addressRoutes = require('./routes/addressRoutes'); // Import routes

const port = process.env.PORT || 3000;
app.get("/", (req, res) => {
  res.send("Hello World");

});

app.use(cors());
app.use(express.json());
app.use(auth);
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

app.use('/api/sso-settings', ssoRoutes)

app.listen(port, () => {
  console.log(`Server started on port ${port}`);
});
