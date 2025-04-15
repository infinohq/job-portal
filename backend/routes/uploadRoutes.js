const express = require("express");
const multer = require("multer");
const fs = require("fs");
const { v4: uuidv4 } = require("uuid");
const { promisify } = require("util");
const { trace, metrics } = require('@opentelemetry/api');

const pipeline = promisify(require("stream").pipeline);

const router = express.Router();

const upload = multer();

const meter = metrics.getMeterProvider().getMeter('express-app');
const resumeUploadCounter = meter.createCounter('resume_upload_count');
const profileUploadCounter = meter.createCounter('profile_upload_count');
const invalidFormatCounter = meter.createCounter('invalid_format_count');
const uploadErrorCounter = meter.createCounter('upload_error_count');

router.post("/resume", upload.single("file"), (req, res) => {
  const { file } = req;
  const span = trace.getTracer().startSpan('Upload Resume');
  span.addEvent('Checking file extension');
  if (file.detectedFileExtension != ".pdf") {
    span.addEvent('Invalid file format');
    invalidFormatCounter.add(1);
    res.status(400).json({
      message: "Invalid format",
    });
  } else {
    const filename = `${uuidv4()}${file.detectedFileExtension}`;
    span.addEvent(`File name generated: ${filename}`);

    pipeline(
      file.stream,
      fs.createWriteStream(`${__dirname}/../public/resume/${filename}`)
    )
      .then(() => {
        span.addEvent('File uploaded successfully');
        resumeUploadCounter.add(1);
        res.send({
          message: "File uploaded successfully",
          url: `/host/resume/${filename}`,
        });
      })
      .catch((err) => {
        span.addEvent('Error while uploading');
        uploadErrorCounter.add(1);
        res.status(400).json({
          message: "Error while uploading",
        });
      });
  }
  span.end();
});

router.post("/profile", upload.single("file"), (req, res) => {
  const { file } = req;
  const span = trace.getTracer().startSpan('Upload Profile');
  span.addEvent('Checking file extension');
  if (
    file.detectedFileExtension != ".jpg" &&
    file.detectedFileExtension != ".png"
  ) {
    span.addEvent('Invalid file format');
    invalidFormatCounter.add(1);
    res.status(400).json({
      message: "Invalid format",
    });
  } else {
    const filename = `${uuidv4()}${file.detectedFileExtension}`;
    span.addEvent(`File name generated: ${filename}`);

    pipeline(
      file.stream,
      fs.createWriteStream(`${__dirname}/../public/profile/${filename}`)
    )
      .then(() => {
        span.addEvent('Profile image uploaded successfully');
        profileUploadCounter.add(1);
        res.send({
          message: "Profile image uploaded successfully",
          url: `/host/profile/${filename}`,
        });
      })
      .catch((err) => {
        span.addEvent('Error while uploading');
        uploadErrorCounter.add(1);
        res.status(400).json({
          message: "Error while uploading",
        });
      });
  }
  span.end();
});

module.exports = router;
