```javascript
const { MeterProvider } = require('@opentelemetry/metrics');
const { ConsoleMetricExporter } = require('@opentelemetry/exporter-console');

const meter = new MeterProvider({
  exporter: new ConsoleMetricExporter(),
  interval: 1000,
}).getMeter('business_metrics');

const requestsCounter = meter.createCounter('requests', {
  description: 'Number of requests to the application',
});

const errorsCounter = meter.createCounter('errors', {
  description: 'Number of errors that occurred in the application',
});

module.exports = {
  jwtSecretKey: "jwt_secret",
  requestsCounter,
  errorsCounter,
};

console.log("JWT secret key initialized");
```