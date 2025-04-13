```javascript
// Business Metric: Jobs Added
const jobsAddedCounter = new OpenTelemetrySDK.metrics.CounterMetric({
  name: "jobs_added_counter",
  description: "Counts the number of jobs added to the database",
});

// Business Metric: Job Applications
const jobApplicationsCounter = new OpenTelemetrySDK.metrics.CounterMetric({
  name: "job_applications_counter",
  description: "Counts the number of job applications made",
});

// Business Metric: Job Applications Limit Reached
const jobApplicationsLimitReachedCounter = new OpenTelemetrySDK.metrics.CounterMetric({
  name: "job_applications_limit_reached_counter",
  description: "Counts the number of times job applications limit is reached",
});

// Business Metric: Job Applications Successful
const jobApplicationsSuccessfulCounter = new OpenTelemetrySDK.metrics.CounterMetric({
  name: "job_applications_successful_counter",
  description: "Counts the number of successful job applications",
});
```
