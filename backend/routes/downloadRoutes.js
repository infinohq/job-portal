const express = require("express");
const fs = require("fs");
const path = require("path");
const { diag } = require("@opentelemetry/api");
const { MeterProvider } = require("@opentelemetry/sdk-metrics-base");

const meterProvider = new MeterProvider();
const meter = meterProvider.getMeter('example-meter');

const resumeRequestCounter = meter.createCounter('resume_requests', {
  description: 'Count of requests to the resume endpoint'
});
const resumeErrorCounter = meter.createCounter('resume_errors', {
  description: 'Count of errors in the resume endpoint'
});

const profileRequestCounter = meter.createCounter('profile_requests', {
  description: 'Count of requests to the profile endpoint'
});
const profileErrorCounter = meter.createCounter('profile_errors', {
  description: 'Count of errors in the profile endpoint'
});

const router = express.Router();

router.get("/resume/:file", (req, res) => {
  resumeRequestCounter.add(1);
  const address = path.join(__dirname, `../public/resume/${req.params.file}`);
  diag.debug(`Accessing resume file at address: ${address}`);
  fs.access(address, fs.F_OK, (err) => {
    if (err) {
      resumeErrorCounter.add(1);
      diag.error(`File not found at address: ${address}`);
      res.status(404).json({
        message: "File not found",
      });
      return;
    }
    diag.debug(`File found, sending file at address: ${address}`);
    res.sendFile(address);
  });
});

router.get("/profile/:file", (req, res) => {
  profileRequestCounter.add(1);
  const address = path.join(__dirname, `../public/profile/${req.params.file}`);
  diag.debug(`Accessing profile file at address: ${address}`);
  fs.access(address, fs.F_OK, (err) => {
    if (err) {
      profileErrorCounter.add(1);
      diag.error(`File not found at address: ${address}`);
      res.status(404).json({
        message: "File not found",
      });
      return;
    }
    diag.debug(`File found, sending file at address: ${address}`);
    res.sendFile(address);
  });
});

module.exports = router;
