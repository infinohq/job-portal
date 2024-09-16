const express = require("express");
const fs = require("fs");
const path = require("path");
const { diag, DiagConsoleLogger, DiagLogLevel } = require('@opentelemetry/api');
const { MeterProvider } = require('@opentelemetry/sdk-metrics-base');

// Set up OpenTelemetry diagnostics
diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.ALL);

// Set up OpenTelemetry metrics
const meter = new MeterProvider().getMeter('business-metrics');
const fileAccessCounter = meter.createCounter('file_access_count', {
  description: 'Count of file access attempts',
});
const fileNotFoundCounter = meter.createCounter('file_not_found_count', {
  description: 'Count of file not found errors',
});
const fileSentCounter = meter.createCounter('file_sent_count', {
  description: 'Count of files successfully sent',
});

const router = express.Router();

router.get("/resume/:file", (req, res) => {
  const address = path.join(__dirname, `../public/resume/${req.params.file}`);
  diag.debug(`Accessing file at address: ${address}`);
  fileAccessCounter.add(1, { route: '/resume/:file' });
  fs.access(address, fs.F_OK, (err) => {
    if (err) {
      diag.error(`File not found at address: ${address}`);
      fileNotFoundCounter.add(1, { route: '/resume/:file' });
      res.status(404).json({
        message: "File not found",
      });
      return;
    }
    diag.debug(`File found, sending file at address: ${address}`);
    fileSentCounter.add(1, { route: '/resume/:file' });
    res.sendFile(address);
  });
});

router.get("/profile/:file", (req, res) => {
  const address = path.join(__dirname, `../public/profile/${req.params.file}`);
  diag.debug(`Accessing file at address: ${address}`);
  fileAccessCounter.add(1, { route: '/profile/:file' });
  fs.access(address, fs.F_OK, (err) => {
    if (err) {
      diag.error(`File not found at address: ${address}`);
      fileNotFoundCounter.add(1, { route: '/profile/:file' });
      res.status(404).json({
        message: "File not found",
      });
      return;
    }
    diag.debug(`File found, sending file at address: ${address}`);
    fileSentCounter.add(1, { route: '/profile/:file' });
    res.sendFile(address);
  });
});

module.exports = router;
