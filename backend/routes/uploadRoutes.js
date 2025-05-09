```javascript
const { MeterProvider } = require('@opentelemetry/metrics');
const { ConsoleMetricExporter } = require('@opentelemetry/exporter-console');

const meter = new MeterProvider({
  exporter: new ConsoleMetricExporter(),
  interval: 1000,
}).getMeter('business_metrics');

const requestsCounter = meter.createCounter('requests_counter', {
  description: 'Counts the number of requests',
});

const errorsCounter = meter.createCounter('errors_counter', {
  description: 'Counts the number of errors',
});

console.log("Request received to upload resume");
requestsCounter.add(1);

console.log("Request received to upload profile image");
requestsCounter.add(1);

console.log("Resume file format checked");

console.log("Profile image format checked");

console.log("Resume file uploaded successfully");

console.log("Profile image uploaded successfully");

console.log("Error occurred while uploading resume file");
errorsCounter.add(1);

console.log("Error occurred while uploading profile image");
errorsCounter.add(1);
```