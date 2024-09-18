const express = require("express");
const fs = require("fs");
const path = require("path");
const { diag, metrics } = require("@opentelemetry/api");

const router = express.Router();

const resumeRequestCounter = metrics.getMeter('default').createCounter('resume_requests', {
  description: 'Counts the number of requests to the resume endpoint'
});
const resumeErrorCounter = metrics.getMeter('default').createCounter('resume_errors', {
  description: 'Counts the number of errors encountered in the resume endpoint'
});

router.get("/resume/:file", (req, res) => {
  resumeRequestCounter.add(1);
  const address = path.join(__dirname, `../public/resume/${req.params.file}`);
  diag.debug(`Attempting to access file at address: ${address}`);
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

const profileRequestCounter = metrics.getMeter('default').createCounter('profile_requests', {
  description: 'Counts the number of requests to the profile endpoint'
});
const profileErrorCounter = metrics.getMeter('default').createCounter('profile_errors', {
  description: 'Counts the number of errors encountered in the profile endpoint'
});

router.get("/profile/:file", (req, res) => {
  profileRequestCounter.add(1);
  const address = path.join(__dirname, `../public/profile/${req.params.file}`);
  diag.debug(`Attempting to access file at address: ${address}`);
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
