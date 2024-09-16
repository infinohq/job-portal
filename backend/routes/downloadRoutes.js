```javascript
const express = require("express");
const fs = require("fs");
const path = require("path");
const { diag, DiagConsoleLogger, DiagLogLevel } = require('@opentelemetry/api');
const { MeterProvider } = require('@opentelemetry/sdk-metrics-base');

// Set up OpenTelemetry diagnostics
diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.ALL);

// Set up OpenTelemetry metrics
const meter = new MeterProvider().getMeter('file-access-meter');
const resumeFileAccessCounter = meter.createCounter('resume_file_access_count', {
  description: 'Count of resume file access attempts',
});
const resumeFileNotFoundCounter = meter.createCounter('resume_file_not_found_count', {
  description: 'Count of resume file not found errors',
});
const profileFileAccessCounter = meter.createCounter('profile_file_access_count', {
  description: 'Count of profile file access attempts',
});
const profileFileNotFoundCounter = meter.createCounter('profile_file_not_found_count', {
  description: 'Count of profile file not found errors',
});

const router = express.Router();

router.get("/resume/:file", (req, res) => {
  const address = path.join(__dirname, `../public/resume/${req.params.file}`);
  diag.debug(`Accessing file at address: ${address}`);
  resumeFileAccessCounter.add(1);
  fs.access(address, fs.F_OK, (err) => {
    if (err) {
      diag.error(`File not found at address: ${address}`);
      resumeFileNotFoundCounter.add(1);
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
  const address = path.join(__dirname, `../public/profile/${req.params.file}`);
  diag.debug(`Accessing file at address: ${address}`);
  profileFileAccessCounter.add(1);
  fs.access(address, fs.F_OK, (err) => {
    if (err) {
      diag.error(`File not found at address: ${address}`);
      profileFileNotFoundCounter.add(1);
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
```