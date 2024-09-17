const express = require("express");
const multer = require("multer");
const fs = require("fs");
const { v4: uuidv4 } = require("uuid");
const { promisify } = require("util");
const { diag, DiagConsoleLogger, DiagLogLevel, metrics } = require('@opentelemetry/api');

// Set up OpenTelemetry diagnostics
diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.ALL);

// Set up OpenTelemetry metrics
const meter = metrics.getMeter('file-upload-service');
const resumeUploadCounter = meter.createCounter('resume_uploads', {
  description: 'Count of resume uploads',
});
const profileUploadCounter = meter.createCounter('profile_uploads', {
  description: 'Count of profile uploads',
});
const invalidResumeFormatCounter = meter.createCounter('invalid_resume_format', {
  description: 'Count of invalid resume format uploads',
});
const invalidProfileFormatCounter = meter.createCounter('invalid_profile_format', {
  description: 'Count of invalid profile format uploads',
});

const pipeline = promisify(require("stream").pipeline);

const router = express.Router();

const upload = multer();

router.post("/resume", upload.single("file"), (req, res) => {
  const { file } = req;
  diag.debug(`Received file for resume upload: ${file.originalname}`);
  if (file.detectedFileExtension != ".pdf") {
    diag.error(`Invalid file format for resume: ${file.detectedFileExtension}`);
    invalidResumeFormatCounter.add(1);
    res.status(400).json({
      message: "Invalid format",
    });
  } else {
    const filename = `${uuidv4()}${file.detectedFileExtension}`;
    diag.debug(`Generated filename for resume: ${filename}`);

    pipeline(
      file.stream,
      fs.createWriteStream(`${__dirname}/../public/resume/${filename}`)
    )
      .then(() => {
        diag.info(`Resume file uploaded successfully: ${filename}`);
        resumeUploadCounter.add(1);
        res.send({
          message: "File uploaded successfully",
          url: `/host/resume/${filename}`,
        });
      })
      .catch((err) => {
        diag.error(`Error while uploading resume: ${err.message}`);
        res.status(400).json({
          message: "Error while uploading",
        });
      });
  }
});

router.post("/profile", upload.single("file"), (req, res) => {
  const { file } = req;
  diag.debug(`Received file for profile upload: ${file.originalname}`);
  if (
    file.detectedFileExtension != ".jpg" &&
    file.detectedFileExtension != ".png"
  ) {
    diag.error(`Invalid file format for profile: ${file.detectedFileExtension}`);
    invalidProfileFormatCounter.add(1);
    res.status(400).json({
      message: "Invalid format",
    });
  } else {
    const filename = `${uuidv4()}${file.detectedFileExtension}`;
    diag.debug(`Generated filename for profile: ${filename}`);

    pipeline(
      file.stream,
      fs.createWriteStream(`${__dirname}/../public/profile/${filename}`)
    )
      .then(() => {
        diag.info(`Profile image uploaded successfully: ${filename}`);
        profileUploadCounter.add(1);
        res.send({
          message: "Profile image uploaded successfully",
          url: `/host/profile/${filename}`,
        });
      })
      .catch((err) => {
        diag.error(`Error while uploading profile image: ${err.message}`);
        res.status(400).json({
          message: "Error while uploading",
        });
      });
  }
});

module.exports = router;
