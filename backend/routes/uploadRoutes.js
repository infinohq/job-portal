const express = require("express");
const multer = require("multer");
const fs = require("fs");
const { v4: uuidv4 } = require("uuid");
const { promisify } = require("util");
const { diag, DiagConsoleLogger, DiagLogLevel } = require("@opentelemetry/api");

diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.ALL);

const pipeline = promisify(require("stream").pipeline);

const router = express.Router();

const upload = multer();

router.post("/resume", upload.single("file"), (req, res) => {
  diag.info("Received request to upload resume");
  const { file } = req;
  if (file.detectedFileExtension != ".pdf") {
    diag.warn("Invalid file format for resume upload");
    res.status(400).json({
      message: "Invalid format",
    });
  } else {
    const filename = `${uuidv4()}${file.detectedFileExtension}`;
    diag.info(`Generated filename for resume: ${filename}`);

    pipeline(
      file.stream,
      fs.createWriteStream(`${__dirname}/../public/resume/${filename}`)
    )
      .then(() => {
        diag.info("Resume file uploaded successfully");
        res.send({
          message: "File uploaded successfully",
          url: `/host/resume/${filename}`,
        });
      })
      .catch((err) => {
        diag.error("Error while uploading resume file", err);
        res.status(400).json({
          message: "Error while uploading",
        });
      });
  }
});

router.post("/profile", upload.single("file"), (req, res) => {
  diag.info("Received request to upload profile image");
  const { file } = req;
  if (
    file.detectedFileExtension != ".jpg" &&
    file.detectedFileExtension != ".png"
  ) {
    diag.warn("Invalid file format for profile image upload");
    res.status(400).json({
      message: "Invalid format",
    });
  } else {
    const filename = `${uuidv4()}${file.detectedFileExtension}`;
    diag.info(`Generated filename for profile image: ${filename}`);

    pipeline(
      file.stream,
      fs.createWriteStream(`${__dirname}/../public/profile/${filename}`)
    )
      .then(() => {
        diag.info("Profile image uploaded successfully");
        res.send({
          message: "Profile image uploaded successfully",
          url: `/host/profile/${filename}`,
        });
      })
      .catch((err) => {
        diag.error("Error while uploading profile image", err);
        res.status(400).json({
          message: "Error while uploading",
        });
      });
  }
});

module.exports = router;