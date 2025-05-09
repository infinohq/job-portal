const { trace } = require("@opentelemetry/api");

const tracer = trace.getTracer("file-upload-tracer");

router.post("/resume", upload.single("file"), (req, res) => {
  const { file } = req;
  if (file.detectedFileExtension != ".pdf") {
    res.status(400).json({
      message: "Invalid format",
    });
    tracer.addEvent("Invalid file format for resume upload");
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
        tracer.addEvent("Resume file uploaded successfully");
      })
      .catch((err) => {
        res.status(400).json({
          message: "Error while uploading",
        });
        tracer.addEvent("Error uploading resume file");
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
    tracer.addEvent("Invalid file format for profile image upload");
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
        tracer.addEvent("Profile image uploaded successfully");
      })
      .catch((err) => {
        res.status(400).json({
          message: "Error while uploading",
        });
        tracer.addEvent("Error uploading profile image");
      });
  }
});