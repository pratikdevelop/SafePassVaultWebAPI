// server.js
require("dotenv").config()
require("./model/conn")

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
const auth = require("./middleware")
app.use(cors());
app.use(express.json());
app.use(auth);
app.use("/api/auth", users)
app.use("/api/passwords", password)
app.use("/api/tags", tagRoutes)
app.use("/api/notes",noteController)
app.use("/api/proofIds",proofIdsController)
app.use("/api/cards",cardControlller)
app.use('/api/security-questions', securityQuestionRoutes);
app.use('/api/files', fileRoutes)

app.get("/", (req, res) => {
  res.send("Hello World");
});


app.listen(3000, () => {
  console.log("Server started on port http://localhost:3000");
});
