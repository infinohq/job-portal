```javascript
const { MeterProvider } = require('@opentelemetry/metrics');
const { PrometheusExporter } = require('@opentelemetry/exporter-prometheus');

const meter = new MeterProvider({
  exporter: new PrometheusExporter({
    startServer: true,
  }),
  interval: 10000,
}).getMeter('business_metrics');

const requestsCounter = meter.createCounter("requests_counter", {
  description: "Number of requests to resume and profile routes",
});

const errorsCounter = meter.createCounter("errors_counter", {
  description: "Number of errors encountered in resume and profile routes",
});

router.get("/resume/:file", (req, res) => {
  requestsCounter.add(1);
  const address = path.join(__dirname, `../public/resume/${req.params.file}`);
  console.log("Checking if file exists for resume");
  fs.access(address, fs.F_OK, (err) => {
    if (err) {
      errorsCounter.add(1);
      console.log("Resume file not found");
      res.status(404).json({
        message: "File not found",
      });
      return;
    }
    console.log("Sending resume file");
    res.sendFile(address);
  });
});

router.get("/profile/:file", (req, res) => {
  requestsCounter.add(1);
  const address = path.join(__dirname, `../public/profile/${req.params.file}`);
  console.log("Checking if file exists for profile");
  fs.access(address, fs.F_OK, (err) => {
    if (err) {
      errorsCounter.add(1);
      console.log("Profile file not found");
      res.status(404).json({
        message: "File not found",
      });
      return;
    }
    console.log("Sending profile file");
    res.sendFile(address);
  });
});

module.exports = router;
```