const express = require("express");
const fs = require("fs");
const path = require("path");
const { diag, DiagConsoleLogger, DiagLogLevel } = require('@opentelemetry/api');

// Set up OpenTelemetry diagnostics
diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.ALL);

const router = express.Router();

router.get("/resume/:file", (req, res) => {
  const address = path.join(__dirname, `../public/resume/${req.params.file}`);
  diag.debug(`Accessing file at address: ${address}`);
  fs.access(address, fs.F_OK, (err) => {
    if (err) {
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
  const address = path.join(__dirname, `../public/profile/${req.params.file}`);
  diag.debug(`Accessing file at address: ${address}`);
  fs.access(address, fs.F_OK, (err) => {
    if (err) {
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