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
const meter = new MeterProvider({
  exporter: new PrometheusExporter({ startServer: true }),
  interval: 1000,
}).getMeter('job-portal-meter');

// Define business metrics
const jobApplicationsCounter = meter.createCounter('job_applications', {
  description: 'Count of job applications submitted',
});

const userRegistrationsCounter = meter.createCounter('user_registrations', {
  description: 'Count of user registrations',
});

const resumeUploadsCounter = meter.createCounter('resume_uploads', {
  description: 'Count of resume uploads',
});

const profileViewsCounter = meter.createCounter('profile_views', {
  description: 'Count of profile views',
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
app.use("/auth", require("./routes/authRoutes"));
app.use("/api", require("./routes/apiRoutes"));
app.use("/upload", require("./routes/uploadRoutes"));
app.use("/host", require("./routes/downloadRoutes"));

// Increment metrics in relevant routes
app.post('/api/job-application', (req, res) => {
  jobApplicationsCounter.add(1);
  // existing logic for job application submission
});

app.post('/auth/register', (req, res) => {
  userRegistrationsCounter.add(1);
  // existing logic for user registration
});

app.post('/upload/resume', (req, res) => {
  resumeUploadsCounter.add(1);
  // existing logic for resume upload
});

app.get('/api/profile/:id', (req, res) => {
  profileViewsCounter.add(1);
  // existing logic for profile view
});

app.listen(port, () => {
  diag.info(`Server started on port ${port}!`);
});
