const express = require("express");
const fs = require("fs");
const path = require("path");
const { diag } = require("@opentelemetry/api");
const { MeterProvider } = require("@opentelemetry/sdk-metrics-base");

const meter = new MeterProvider().getMeter('example-meter');
const requestCounter = meter.createCounter('request_counter', {
  description: 'Counts requests to the endpoints',
});
const errorRate = meter.createCounter('error_rate', {
  description: 'Counts errors encountered in the endpoints',
});

const router = express.Router();

router.get("/resume/:file", (req, res) => {
  requestCounter.add(1, { route: '/resume/:file' });
  const address = path.join(__dirname, `../public/resume/${req.params.file}`);
  diag.debug(`Attempting to access file at address: ${address}`);
  fs.access(address, fs.F_OK, (err) => {
    if (err) {
      errorRate.add(1, { route: '/resume/:file' });
      diag.error(`File not found at address: ${address}`);
      res.status(404).json({
        message: "File not found",
      });
      return;
    }
    diag.debug(`File found. Sending file at address: ${address}`);
    res.sendFile(address);
  });
});

router.get("/profile/:file", (req, res) => {
  requestCounter.add(1, { route: '/profile/:file' });
  const address = path.join(__dirname, `../public/profile/${req.params.file}`);
  diag.debug(`Attempting to access file at address: ${address}`);
  fs.access(address, fs.F_OK, (err) => {
    if (err) {
      errorRate.add(1, { route: '/profile/:file' });
      diag.error(`File not found at address: ${address}`);
      res.status(404).json({
        message: "File not found",
      });
      return;
    }
    diag.debug(`File found. Sending file at address: ${address}`);
    res.sendFile(address);
  });
});

module.exports = router;
