const express = require("express");
const multer = require("multer");
const fs = require("fs");
const { v4: uuidv4 } = require("uuid");
const { promisify } = require("util");
const pipeline = promisify(require("stream").pipeline);
const router = express.Router();

router.post("/resume", upload.single("file"), (req, res) => {
  console.log("Received POST request for uploading resume");
  const { file } = req;
  if (file.detectedFileExtension != ".pdf") {
    console.log("Invalid format for resume upload");
    res.status(400).json({
      message: "Invalid format",
    });
  } else {
    console.log("Resume upload started");
    const filename = `${uuidv4()}${file.detectedFileExtension}`;

    pipeline(
      file.stream,
      fs.createWriteStream(`${__dirname}/../public/resume/${filename}`)
    )
      .then(() => {
        console.log("Resume uploaded successfully");
        res.send({
          message: "File uploaded successfully",
          url: `/host/resume/${filename}`,
        });
      })
      .catch((err) => {
        console.error("Error while uploading resume");
        res.status(400).json({
          message: "Error while uploading",
        });
      });
  }
});

router.post("/profile", upload.single("file"), (req, res) => {
  console.log("Received POST request for uploading profile image");
  const { file } = req;
  if (
    file.detectedFileExtension != ".jpg" &&
    file.detectedFileExtension != ".png"
  ) {
    console.log("Invalid format for profile image upload");
    res.status(400).json({
      message: "Invalid format",
    });
  } else {
    console.log("Profile image upload started");
    const filename = `${uuidv4()}${file.detectedFileExtension}`;

    pipeline(
      file.stream,
      fs.createWriteStream(`${__dirname}/../public/profile/${filename}`)
    )
      .then(() => {
        console.log("Profile image uploaded successfully");
        res.send({
          message: "Profile image uploaded successfully",
          url: `/host/profile/${filename}`,
        });
      })
      .catch((err) => {
        console.error("Error while uploading profile image");
        res.status(400).json({
          message: "Error while uploading",
        });
      });
  }
});

module.exports = router;