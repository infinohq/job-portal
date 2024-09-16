const { MeterProvider } = require('@opentelemetry/metrics');
const { PrometheusExporter } = require('@opentelemetry/exporter-prometheus');

const meter = new MeterProvider({
  exporter: new PrometheusExporter({
    startServer: true,
  }),
  interval: 10000,
}).getMeter('business_metrics');

const filesNotFoundCounter = meter.createCounter("files_not_found_counter", {
  description: "Counts the number of files that were not found",
});

const filesSentCounter = meter.createCounter("files_sent_counter", {
  description: "Counts the number of files that were successfully sent",
});

router.get("/resume/:file", (req, res) => {
  const address = path.join(__dirname, `../public/resume/${req.params.file}`);
  fs.access(address, fs.F_OK, (err) => {
    if (err) {
      res.status(404).json({
        message: "File not found",
      });
      console.log("Resume file not found");
      filesNotFoundCounter.add(1);
      return;
    }
    res.sendFile(address);
    console.log("Resume file sent successfully");
    filesSentCounter.add(1);
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
      filesNotFoundCounter.add(1);
      return;
    }
    res.sendFile(address);
    console.log("Profile file sent successfully");
    filesSentCounter.add(1);
  });
});

module.exports = router;