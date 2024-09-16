const { trace } = require("@opentelemetry/api");

const express = require("express");
const fs = require("fs");
const path = require("path");

const router = express.Router();

router.get("/resume/:file", (req, res) => {
  const address = path.join(__dirname, `../public/resume/${req.params.file}`);
  fs.access(address, fs.F_OK, (err) => {
    if (err) {
      res.status(404).json({
        message: "File not found",
      });
      trace.log({ message: "File not found" });
      return;
    }
    res.sendFile(address);
    trace.log({ message: "Resume file sent" });
  });
});

router.get("/profile/:file", (req, res) => {
  const address = path.join(__dirname, `../public/profile/${req.params.file}`);
  fs.access(address, fs.F_OK, (err) => {
    if (err) {
      res.status(404).json({
        message: "File not found",
      });
      trace.log({ message: "File not found" });
      return;
    }
    res.sendFile(address);
    trace.log({ message: "Profile file sent" });
  });
});

module.exports = router;