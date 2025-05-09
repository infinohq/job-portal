const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const passportConfig = require("./lib/passportConfig");
const cors = require("cors");
const fs = require("fs");
const { diag, DiagConsoleLogger, DiagLogLevel } = require('@opentelemetry/api');
const { MeterProvider } = require('@opentelemetry/sdk-metrics-base');
const { PrometheusExporter } = require('@opentelemetry/exporter-prometheus');

// Set up OpenTelemetry diagnostics
diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.ALL);

// Set up OpenTelemetry metrics
const meterProvider = new MeterProvider({
  exporter: new PrometheusExporter({ startServer: true }),
  interval: 1000,
});
const meter = meterProvider.getMeter('job-portal-meter');

const authRequestCounter = meter.createCounter('auth_requests', {
  description: 'Count of authentication requests',
});
const apiRequestCounter = meter.createCounter('api_requests', {
  description: 'Count of API requests',
});
const uploadRequestCounter = meter.createCounter('upload_requests', {
  description: 'Count of upload requests',
});
const downloadRequestCounter = meter.createCounter('download_requests', {
  description: 'Count of download requests',
});

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
app.use("/auth", (req, res, next) => {
  authRequestCounter.add(1);
  next();
}, require("./routes/authRoutes"));

app.use("/api", (req, res, next) => {
  apiRequestCounter.add(1);
  next();
}, require("./routes/apiRoutes"));

app.use("/upload", (req, res, next) => {
  uploadRequestCounter.add(1);
  next();
}, require("./routes/uploadRoutes"));

app.use("/host", (req, res, next) => {
  downloadRequestCounter.add(1);
  next();
}, require("./routes/downloadRoutes"));

app.listen(port, () => {
  diag.info(`Server started on port ${port}!`);
});
