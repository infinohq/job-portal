```javascript
const { MeterProvider } = require('@opentelemetry/metrics');
const { ConsoleMetricExporter } = require('@opentelemetry/exporter-console');

const meter = new MeterProvider({
  exporter: new ConsoleMetricExporter(),
  interval: 1000,
}).getMeter('business_metrics');

const requestsCounter = meter.createCounter('user_signup_requests', {
  description: 'Number of requests for user signup',
});

const errorsCounter = meter.createCounter('user_signup_errors', {
  description: 'Number of errors during user signup',
});

console.log("Request received for user signup");
requestsCounter.add(1);

console.log("User signup data:", data);

console.log("User saved successfully");

console.log("User details saved successfully");

console.log("Token generated for user signup");

const requestsCounterLogin = meter.createCounter('user_login_requests', {
  description: 'Number of requests for user login',
});

const errorsCounterLogin = meter.createCounter('user_login_errors', {
  description: 'Number of errors during user login',
});

console.log("Request received for user login");
requestsCounterLogin.add(1);

console.log("Token generated for user login");
```