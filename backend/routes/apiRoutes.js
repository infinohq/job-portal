```javascript
const { MeterProvider } = require('@opentelemetry/metrics');
const { ConsoleMetricExporter } = require('@opentelemetry/exporter-console');

const meter = new MeterProvider({
  exporter: new ConsoleMetricExporter(),
  interval: 1000,
}).getMeter('business_metrics');

const requestsCounter = meter.createCounter('total_requests', {
  description: 'Total number of requests',
});

const errorsCounter = meter.createCounter('total_errors', {
  description: 'Total number of errors',
});

console.log("User is trying to add a new job");
requestsCounter.add(1);

console.log("User is trying to get all jobs");
requestsCounter.add(1);

console.log("User is trying to get info about a particular job");
requestsCounter.add(1);

console.log("User is trying to update info of a particular job");
requestsCounter.add(1);

console.log("User is trying to delete a job");
requestsCounter.add(1);

console.log("User is trying to get personal details");
requestsCounter.add(1);

console.log("User is trying to get user details from id");
requestsCounter.add(1);

console.log("User is trying to update user details");
requestsCounter.add(1);

console.log("User is trying to apply for a job");
requestsCounter.add(1);

console.log("User is trying to get applications for a particular job");
requestsCounter.add(1);

console.log("User is trying to get all applications");
requestsCounter.add(1);

console.log("User is trying to update status of an application");
requestsCounter.add(1);

console.log("User is trying to get a list of final applicants");
requestsCounter.add(1);

console.log("User is trying to add or update a rating");
requestsCounter.add(1);

console.log("User is trying to get personal rating");
requestsCounter.add(1);
```