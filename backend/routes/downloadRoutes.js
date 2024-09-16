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
      console.log("Resume file not found");
      return;
    }
    res.sendFile(address);
    console.log("Resume file sent successfully");
  });
});

router.get("/profile/:file", (req, res) => {
  const address = path.join(__dirname, `../public/profile/${req.params.file}`);
  fs.access(address, fs.F_OK, (err) => {
    if (err) {
      res.status(404).json({
        message: "File not found",
      });
      console.log("Profile file not found");
      return;
    }
    res.sendFile(address);
    console.log("Profile file sent successfully");
  });
});

module.exports = router;