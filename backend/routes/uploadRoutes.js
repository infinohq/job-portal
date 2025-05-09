const { trace } = require("@opentelemetry/api");

const tracer = trace.getTracer("file-upload-service");

const log = (message) => {
  console.log(message);
};

router.post("/resume", upload.single("file"), (req, res) => {
  const { file } = req;
  if (file.detectedFileExtension != ".pdf") {
    res.status(400).json({
      message: "Invalid format",
    });
    log("Invalid file format for resume upload");
  } else {
    const filename = `${uuidv4()}${file.detectedFileExtension}`;

    pipeline(
      file.stream,
      fs.createWriteStream(`${__dirname}/../public/resume/${filename}`)
    )
      .then(() => {
        res.send({
          message: "File uploaded successfully",
          url: `/host/resume/${filename}`,
        });
        log("Resume file uploaded successfully");
      })
      .catch((err) => {
        res.status(400).json({
          message: "Error while uploading",
        });
        log("Error uploading resume file");
      });
  }
});

router.post("/profile", upload.single("file"), (req, res) => {
  const { file } = req;
  if (
    file.detectedFileExtension != ".jpg" &&
    file.detectedFileExtension != ".png"
  ) {
    res.status(400).json({
      message: "Invalid format",
    });
    log("Invalid file format for profile image upload");
  } else {
    const filename = `${uuidv4()}${file.detectedFileExtension}`;

    pipeline(
      file.stream,
      fs.createWriteStream(`${__dirname}/../public/profile/${filename}`)
    )
      .then(() => {
        res.send({
          message: "Profile image uploaded successfully",
          url: `/host/profile/${filename}`,
        });
        log("Profile image uploaded successfully");
      })
      .catch((err) => {
        res.status(400).json({
          message: "Error while uploading",
        });
        log("Error uploading profile image");
      });
  }
});