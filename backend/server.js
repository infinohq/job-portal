const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const passportConfig = require("./lib/passportConfig");
const cors = require("cors");
const fs = require("fs");
const { diag, DiagConsoleLogger, DiagLogLevel } = require('@opentelemetry/api');

// Set up OpenTelemetry diagnostics
diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.ALL);

// MongoDB
mongoose
  .connect("mongodb://localhost:27017/jobPortal", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
    useFindAndModify: false,
  })
  .then((res) => {
    diag.info("Connected to DB", { res });
  })
  .catch((err) => {
    diag.error("Error connecting to DB", { err });
  });

// initialising directories
if (!fs.existsSync("./public")) {
  diag.info("Creating directory: ./public");
  fs.mkdirSync("./public");
}
if (!fs.existsSync("./public/resume")) {
  diag.info("Creating directory: ./public/resume");
  fs.mkdirSync("./public/resume");
}
if (!fs.existsSync("./public/profile")) {
  diag.info("Creating directory: ./public/profile");
  fs.mkdirSync("./public/profile");
}

const app = express();
const port = 4444;

app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies

// Setting up middlewares
app.use(cors());
app.use(express.json());
app.use(passportConfig.initialize());

// Routing
app.use("/auth", require("./routes/authRoutes"));
app.use("/api", require("./routes/apiRoutes"));
app.use("/upload", require("./routes/uploadRoutes"));
app.use("/host", require("./routes/downloadRoutes"));

app.listen(port, () => {
  diag.info(`Server started on port ${port}!`);
});
