const express = require("express");
const fs = require("fs");
const path = require("path");
const { trace, metrics } = require('@opentelemetry/api');
const meter = metrics.getMeter();

const router = express.Router();

const resumeFileCounter = meter.createCounter('resume_file_requests', {
  description: 'Counts the number of times a resume file is requested',
});

const profileFileCounter = meter.createCounter('profile_file_requests', {
  description: 'Counts the number of times a profile file is requested',
});

const fileNotFoundErrorCounter = meter.createCounter('file_not_found_errors', {
  description: 'Counts the number of times a file not found error occurs',
});

const fileAccessCounter = meter.createCounter('file_accesses', {
  description: 'Counts the number of times a file is accessed',
});

router.get("/resume/:file", (req, res) => {
  const span = trace.getTracer().startSpan('GET /resume/:file');
  const address = path.join(__dirname, `../public/resume/${req.params.file}`);
  span.addEvent('File address generated', { address });
  resumeFileCounter.add(1);
  fs.access(address, fs.F_OK, (err) => {
    if (err) {
      span.addEvent('File access error', { err });
      fileNotFoundErrorCounter.add(1);
      res.status(404).json({
        message: "File not found",
      });
      span.end();
      return;
    }
    fileAccessCounter.add(1);
    res.sendFile(address);
    span.end();
  });
});

router.get("/profile/:file", (req, res) => {
  const span = trace.getTracer().startSpan('GET /profile/:file');
  const address = path.join(__dirname, `../public/profile/${req.params.file}`);
  span.addEvent('File address generated', { address });
  profileFileCounter.add(1);
  fs.access(address, fs.F_OK, (err) => {
    if (err) {
      span.addEvent('File access error', { err });
      fileNotFoundErrorCounter.add(1);
      res.status(404).json({
        message: "File not found",
      });
      span.end();
      return;
    }
    fileAccessCounter.add(1);
    res.sendFile(address);
    span.end();
  });
});

module.exports = router;
