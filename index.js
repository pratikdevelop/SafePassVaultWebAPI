// server.js
require("dotenv").config()
require("./model/conn")

const express = require("express");
const app = express();
const cors = require("cors");
const password = require("./controller/password")
const users = require("./controller/users")
const tagscontroller = require("./controller/tag-controller")
const noteController = require('./controller/note-controller')
const proofIdsController = require('./controller/proofid-controller')
const cardControlller = require('./controller/card-controller')
const auth = require("./middleware")
app.use(cors());
app.use(express.json());
app.use(auth);
app.use("/api/auth", users)
app.use("/api/passwords", password)
app.use("/api/tags", tagscontroller)
app.use("/api/notes",noteController)
app.use("/api/proofIds",proofIdsController)
app.use("/api/cards",cardControlller)

app.get("/", (req, res) => {
  res.send("Hello World");
});


app.listen(3000, () => {
  console.log("Server started on port http://localhost:3000");
});
