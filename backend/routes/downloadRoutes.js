const { MeterProvider } = require('@opentelemetry/metrics');
const { Resource } = require('@opentelemetry/resources');
const { SemanticResourceAttributes } = require('@opentelemetry/semantic-conventions');

const meter = new MeterProvider({
  resource: new Resource({
    [SemanticResourceAttributes.SERVICE_NAME]: 'file-service',
  }),
}).getMeter('file-service-metrics');

const fileNotFoundCounter = meter.createCounter("file_not_found_counter", {
  description: "Counts the number of times a requested file was not found",
});

const fileSentCounter = meter.createCounter("file_sent_counter", {
  description: "Counts the number of times a file was successfully sent",
});

router.get("/resume/:file", (req, res) => {
  const address = path.join(__dirname, `../public/resume/${req.params.file}`);
  fs.access(address, fs.F_OK, (err) => {
    if (err) {
      res.status(404).json({
        message: "File not found",
      });
      console.log("Resume file not found");
      fileNotFoundCounter.add(1);
      return;
    }
    res.sendFile(address);
    console.log("Resume file sent successfully");
    fileSentCounter.add(1);
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
      fileNotFoundCounter.add(1);
      return;
    }
    res.sendFile(address);
    console.log("Profile file sent successfully");
    fileSentCounter.add(1);
  });
});

module.exports = router;