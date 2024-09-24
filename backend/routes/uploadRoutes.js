const express = require("express");
const multer = require("multer");
const fs = require("fs");
const { v4: uuidv4 } = require("uuid");
const { promisify } = require("util");
const { diag } = require("@opentelemetry/api");
const { MeterProvider } = require("@opentelemetry/sdk-metrics-base");

const pipeline = promisify(require("stream").pipeline);

const router = express.Router();

const upload = multer();

const meterProvider = new MeterProvider();
const meter = meterProvider.getMeter('file-upload-service');

const resumeUploadCounter = meter.createCounter('resume_uploads', {
  description: 'Count of resume uploads',
});

const resumeUploadErrorRate = meter.createCounter('resume_upload_errors', {
  description: 'Count of errors during resume uploads',
});

const profileUploadCounter = meter.createCounter('profile_uploads', {
  description: 'Count of profile uploads',
});

const profileUploadErrorRate = meter.createCounter('profile_upload_errors', {
  description: 'Count of errors during profile uploads',
});

router.post("/resume", upload.single("file"), (req, res) => {
  const { file } = req;
  diag.debug("Received file for resume upload", { fileExtension: file.detectedFileExtension });

  if (file.detectedFileExtension != ".pdf") {
    diag.warn("Invalid file format for resume upload", { fileExtension: file.detectedFileExtension });
    resumeUploadErrorRate.add(1);
    res.status(400).json({
      message: "Invalid format",
    });
  } else {
    const filename = `${uuidv4()}${file.detectedFileExtension}`;
    diag.debug("Generated filename for resume", { filename });

    pipeline(
      file.stream,
      fs.createWriteStream(`${__dirname}/../public/resume/${filename}`)
    )
      .then(() => {
        diag.info("Resume file uploaded successfully", { filename });
        resumeUploadCounter.add(1);
        res.send({
          message: "File uploaded successfully",
          url: `/host/resume/${filename}`,
        });
      })
      .catch((err) => {
        diag.error("Error while uploading resume file", { error: err });
        resumeUploadErrorRate.add(1);
        res.status(400).json({
          message: "Error while uploading",
        });
      });
  }
});

router.post("/profile", upload.single("file"), (req, res) => {
  const { file } = req;
  diag.debug("Received file for profile upload", { fileExtension: file.detectedFileExtension });

  if (
    file.detectedFileExtension != ".jpg" &&
    file.detectedFileExtension != ".png"
  ) {
    diag.warn("Invalid file format for profile upload", { fileExtension: file.detectedFileExtension });
    profileUploadErrorRate.add(1);
    res.status(400).json({
      message: "Invalid format",
    });
  } else {
    const filename = `${uuidv4()}${file.detectedFileExtension}`;
    diag.debug("Generated filename for profile", { filename });

    pipeline(
      file.stream,
      fs.createWriteStream(`${__dirname}/../public/profile/${filename}`)
    )
      .then(() => {
        diag.info("Profile image uploaded successfully", { filename });
        profileUploadCounter.add(1);
        res.send({
          message: "Profile image uploaded successfully",
          url: `/host/profile/${filename}`,
        });
      })
      .catch((err) => {
        diag.error("Error while uploading profile image", { error: err });
        profileUploadErrorRate.add(1);
        res.status(400).json({
          message: "Error while uploading",
        });
      });
  }
});

module.exports = router;
