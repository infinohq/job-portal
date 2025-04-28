const express = require("express");
const multer = require("multer");
const fs = require("fs");
const { v4: uuidv4 } = require("uuid");
const { promisify } = require("util");
const { diag, metrics } = require("@opentelemetry/api");

const pipeline = promisify(require("stream").pipeline);

const router = express.Router();

const upload = multer();

const resumeUploadCounter = metrics.getCounter('resume_upload_requests', {
  description: 'Count of resume upload requests'
});

const resumeUploadErrorRate = metrics.getCounter('resume_upload_errors', {
  description: 'Count of errors during resume upload'
});

const profileUploadCounter = metrics.getCounter('profile_upload_requests', {
  description: 'Count of profile upload requests'
});

const profileUploadErrorRate = metrics.getCounter('profile_upload_errors', {
  description: 'Count of errors during profile upload'
});

router.post("/resume", upload.single("file"), (req, res) => {
  resumeUploadCounter.add(1);
  const { file } = req;
  diag.debug("Received file for resume upload", { fileExtension: file.detectedFileExtension });

  if (file.detectedFileExtension != ".pdf") {
    resumeUploadErrorRate.add(1);
    diag.warn("Invalid file format for resume upload", { fileExtension: file.detectedFileExtension });
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
        res.send({
          message: "File uploaded successfully",
          url: `/host/resume/${filename}`,
        });
      })
      .catch((err) => {
        resumeUploadErrorRate.add(1);
        diag.error("Error while uploading resume file", { error: err });
        res.status(400).json({
          message: "Error while uploading",
        });
      });
  }
});

router.post("/profile", upload.single("file"), (req, res) => {
  profileUploadCounter.add(1);
  const { file } = req;
  diag.debug("Received file for profile upload", { fileExtension: file.detectedFileExtension });

  if (
    file.detectedFileExtension != ".jpg" &&
    file.detectedFileExtension != ".png"
  ) {
    profileUploadErrorRate.add(1);
    diag.warn("Invalid file format for profile upload", { fileExtension: file.detectedFileExtension });
    res.status(400).json({
      message: "Invalid format",
    });
  } else {
    const filename = `${uuidv4()}${file.detectedFileExtension}`;
    diag.debug("Generated filename for profile image", { filename });

    pipeline(
      file.stream,
      fs.createWriteStream(`${__dirname}/../public/profile/${filename}`)
    )
      .then(() => {
        diag.info("Profile image uploaded successfully", { filename });
        res.send({
          message: "Profile image uploaded successfully",
          url: `/host/profile/${filename}`,
        });
      })
      .catch((err) => {
        profileUploadErrorRate.add(1);
        diag.error("Error while uploading profile image", { error: err });
        res.status(400).json({
          message: "Error while uploading",
        });
      });
  }
});

module.exports = router;
