const { MeterProvider } = require('@opentelemetry/metrics');
const { PrometheusExporter } = require('@opentelemetry/exporter-prometheus');

const meter = new MeterProvider({
  exporter: new PrometheusExporter({
    startServer: true,
  }),
  interval: 10000,
}).getMeter('job_portal_metrics');

const requestCounter = meter.createCounter("job_portal_requests_total", {
  description: "Total number of requests to the job portal server",
});

const errorCounter = meter.createCounter("job_portal_errors_total", {
  description: "Total number of errors occurred in the job portal server",
});

// Routing
app.use((req, res, next) => {
  requestCounter.add(1);
  next();
});

app.use((err, req, res, next) => {
  errorCounter.add(1);
  next(err);
});

app.use("/auth", require("./routes/authRoutes"));
app.use("/api", require("./routes/apiRoutes"));
app.use("/upload", require("./routes/uploadRoutes"));
app.use("/host", require("./routes/downloadRoutes"));

console.log("Routes configured.");

app.listen(port, () => {
  console.log(`Server started on port ${port}!`);
});

console.log("Server listening on port 4444.");