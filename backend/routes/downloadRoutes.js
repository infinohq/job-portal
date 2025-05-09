```javascript
const express = require("express");
const fs = require("fs");
const path = require("path");

const router = express.Router();

router.get("/resume/:file", (req, res) => {
  const address = path.join(__dirname, `../public/resume/${req.params.file}`);
  console.log("Checking if file exists for resume");
  fs.access(address, fs.F_OK, (err) => {
    if (err) {
      console.log("Resume file not found");
      res.status(404).json({
        message: "File not found",
      });
      return;
    }
    console.log("Sending resume file");
    res.sendFile(address);
  });
});

router.get("/profile/:file", (req, res) => {
  const address = path.join(__dirname, `../public/profile/${req.params.file}`);
  console.log("Checking if file exists for profile");
  fs.access(address, fs.F_OK, (err) => {
    if (err) {
      console.log("Profile file not found");
      res.status(404).json({
        message: "File not found",
      });
      return;
    }
    console.log("Sending profile file");
    res.sendFile(address);
  });
});

module.exports = router;
```