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
    diag.info("Connected to DB");
  })
  .catch((err) => {
    diag.error("Error connecting to DB", err);
  });

// initialising directories
if (!fs.existsSync("./public")) {
  fs.mkdirSync("./public");
  diag.info("Created directory: ./public");
}
if (!fs.existsSync("./public/resume")) {
  fs.mkdirSync("./public/resume");
  diag.info("Created directory: ./public/resume");
}
if (!fs.existsSync("./public/profile")) {
  fs.mkdirSync("./public/profile");
  diag.info("Created directory: ./public/profile");
}

const app = express();
const port = 4444;

app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies

// Setting up middlewares
app.use(cors());
diag.info("CORS middleware set up");
app.use(express.json());
diag.info("Express JSON middleware set up");
app.use(passportConfig.initialize());
diag.info("Passport initialized");

// Routing
app.use("/auth", require("./routes/authRoutes"));
diag.info("Auth routes set up");
app.use("/api", require("./routes/apiRoutes"));
diag.info("API routes set up");
app.use("/upload", require("./routes/uploadRoutes"));
diag.info("Upload routes set up");
app.use("/host", require("./routes/downloadRoutes"));
diag.info("Download routes set up");

app.listen(port, () => {
  diag.info(`Server started on port ${port}!`);
});