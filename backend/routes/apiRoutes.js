const { MeterProvider } = require('@opentelemetry/metrics');
const { PrometheusExporter } = require('@opentelemetry/exporter-prometheus');

const meter = new MeterProvider({
  exporter: new PrometheusExporter({
    startServer: true,
  }),
  interval: 10000,
}).getMeter('business_metrics');

// Metric for counting the number of jobs added
const jobsAddedCounter = meter.createCounter("jobs_added_counter", {
  description: "Counts the number of jobs added to the database",
});

// Metric for counting the number of job applications
const jobApplicationsCounter = meter.createCounter("job_applications_counter", {
  description: "Counts the number of job applications made",
});

// Metric for counting the number of job applications limit reached
const jobApplicationsLimitCounter = meter.createCounter("job_applications_limit_reached_counter", {
  description: "Counts the number of times the job applications limit is reached",
});

// Metric for counting the number of job applications successful
const jobApplicationsSuccessfulCounter = meter.createCounter("job_applications_successful_counter", {
  description: "Counts the number of successful job applications",
});

// Metric for counting the number of job applications rejected
const jobApplicationsRejectedCounter = meter.createCounter("job_applications_rejected_counter", {
  description: "Counts the number of rejected job applications",
});

// Metric for counting the number of job applications cancelled
const jobApplicationsCancelledCounter = meter.createCounter("job_applications_cancelled_counter", {
  description: "Counts the number of cancelled job applications",
});

// Metric for counting the number of job applications finished
const jobApplicationsFinishedCounter = meter.createCounter("job_applications_finished_counter", {
  description: "Counts the number of finished job applications",
});

// Metric for counting the number of job applications deleted
const jobApplicationsDeletedCounter = meter.createCounter("job_applications_deleted_counter", {
  description: "Counts the number of deleted job applications",
});

// Metric for counting the number of job applications with status applied
const jobApplicationsAppliedCounter = meter.createCounter("job_applications_applied_counter", {
  description: "Counts the number of job applications with status 'applied'",
});

// Metric for counting the number of job applications with status accepted
const jobApplicationsAcceptedCounter = meter.createCounter("job_applications_accepted_counter", {
  description: "Counts the number of job applications with status 'accepted'",
});

// Metric for counting the number of job applications with status rejected
const jobApplicationsRejectedCounter = meter.createCounter("job_applications_rejected_counter", {
  description: "Counts the number of job applications with status 'rejected'",
});

// Metric for counting the number of job applications with status cancelled
const jobApplicationsCancelledCounter = meter.createCounter("job_applications_cancelled_counter", {
  description: "Counts the number of job applications with status 'cancelled'",
});

// Metric for counting the number of job applications with status finished
const jobApplicationsFinishedCounter = meter.createCounter("job_applications_finished_counter", {
  description: "Counts the number of job applications with status 'finished'",
});

// Metric for counting the number of job applications with status deleted
const jobApplicationsDeletedCounter = meter.createCounter("job_applications_deleted_counter", {
  description: "Counts the number of job applications with status 'deleted'",
});

// Metric for counting the number of job applications with status rejected
const jobApplicationsRejectedCounter = meter.createCounter("job_applications_rejected_counter", {
  description: "Counts the number of job applications with status 'rejected'",
});

// Metric for counting the number of job applications with status cancelled
const jobApplicationsCancelledCounter = meter.createCounter("job_applications_cancelled_counter", {
  description: "Counts the number of job applications with status 'cancelled'",
});

// Metric for counting the number of job applications with status finished
const jobApplicationsFinishedCounter = meter.createCounter("job_applications_finished_counter", {
  description: "Counts the number of job applications with status 'finished'",
});

// Metric for counting the number of job applications with status deleted
const jobApplicationsDeletedCounter = meter.createCounter("job_applications_deleted_counter", {
  description: "Counts the number of job applications with status 'deleted'",
});

// Metric for counting the number of job applications with status applied
const jobApplicationsAppliedCounter = meter.createCounter("job_applications_applied_counter", {
  description: "Counts the number of job applications with status 'applied'",
});

// Metric for counting the number of job applications with status accepted
const jobApplicationsAcceptedCounter = meter.createCounter("job_applications_accepted_counter", {
  description: "Counts the number of job applications with status 'accepted'",
});

// Metric for counting the number of job applications with status rejected
const jobApplicationsRejectedCounter = meter.createCounter("job_applications_rejected_counter", {
  description: "Counts the number of job applications with status 'rejected'",
});

// Metric for counting the number of job applications with status cancelled
const jobApplicationsCancelledCounter = meter.createCounter("job_applications_cancelled_counter", {
  description: "Counts the number of job applications with status 'cancelled'",
});

// Metric for counting the number of job applications with status finished
const jobApplicationsFinishedCounter = meter.createCounter("job_applications_finished_counter", {
  description: "Counts the number of job applications with status 'finished'",
});

// Metric for counting the number of job applications with status deleted
const jobApplicationsDeletedCounter = meter.createCounter("job_applications_deleted_counter", {
  description: "Counts the number of job applications with status 'deleted'",
});

// Metric for counting the number of job applications with status rejected
const jobApplicationsRejectedCounter = meter.createCounter("job_applications_rejected_counter", {
  description: "Counts the number of job applications with status 'rejected'",
});

// Metric for counting the number of job applications with status cancelled
const jobApplicationsCancelledCounter = meter.createCounter("job_applications_cancelled_counter", {
  description: "Counts the number of job applications with status 'cancelled'",
});

// Metric for counting the number of job applications with status finished
const jobApplicationsFinishedCounter = meter.createCounter("job_applications_finished_counter", {
  description: "Counts the number of job applications with status 'finished'",
});

// Metric for counting the number of job applications with status deleted
const jobApplicationsDeletedCounter = meter.createCounter("job_applications_deleted_counter", {
  description: "Counts the number of job applications with status 'deleted'",
});

// Metric for counting the number of job applications with status applied
const jobApplicationsAppliedCounter = meter.createCounter("job_applications_applied_counter", {
  description: "Counts the number of job applications with status 'applied'",
});

// Metric for counting the number of job applications with status accepted
const jobApplicationsAcceptedCounter = meter.createCounter("job_applications_accepted_counter", {
  description: "Counts the number of job applications with status 'accepted'",
});

// Metric for counting the number of job applications with status rejected
const jobApplicationsRejectedCounter = meter.createCounter("job_applications_rejected_counter", {
  description: "Counts the number of job applications with status 'rejected'",
});

// Metric for counting the number of job applications with status cancelled
const jobApplicationsCancelledCounter = meter.createCounter("job_applications_cancelled_counter", {
  description: "Counts the number of job applications with status 'cancelled'",
});

// Metric for counting the number of job applications with status finished
const jobApplicationsFinishedCounter = meter.createCounter("job_applications_finished_counter", {
  description: "Counts the number of job applications with status 'finished'",
});

// Metric for counting the number of job applications with status deleted
const jobApplicationsDeletedCounter = meter.createCounter("job_applications_deleted_counter", {
  description: "Counts the number of job applications with status 'deleted'",
});

// Metric for counting the number of job applications with status rejected
const jobApplicationsRejectedCounter = meter.createCounter("job_applications_rejected_counter", {
  description: "Counts the number of job applications with status 'rejected'",
});

// Metric for counting the number of job applications with status cancelled
const jobApplicationsCancelledCounter = meter.createCounter("job_applications_cancelled_counter", {
  description: "Counts the number of job applications with status 'cancelled'",
});

// Metric for counting the number of job applications with status finished
const jobApplicationsFinishedCounter = meter.createCounter("job_applications_finished_counter", {
  description: "Counts the number of job applications with status 'finished'",
});

// Metric for counting the number of job applications with status deleted
const jobApplicationsDeletedCounter = meter.createCounter("job_applications_deleted_counter", {
  description: "Counts the number of job applications with status 'deleted'",
});

// Metric for counting the number of job applications with status applied
const jobApplicationsAppliedCounter = meter.createCounter("job_applications_applied_counter", {
  description: "Counts the number of job applications with status 'applied'",
});

// Metric for counting the number of job applications with status accepted
const jobApplicationsAcceptedCounter = meter.createCounter("job_applications_accepted_counter", {
  description: "Counts the number of job applications with status 'accepted'",
});

// Metric for counting the number of job applications with status rejected
const jobApplicationsRejectedCounter = meter.createCounter("job_applications_rejected_counter", {
  description: "Counts the number of job applications with status 'rejected'",
});

// Metric for counting the number of job applications with status cancelled
const jobApplicationsCancelledCounter = meter.createCounter("job_applications_cancelled_counter", {
  description: "Counts the number of job applications with status 'cancelled'",
});

// Metric for counting the number of job applications with status finished
const jobApplicationsFinishedCounter = meter.createCounter("job_applications_finished_counter", {
  description: "Counts the number of job applications with status 'finished'",
});

// Metric for counting the number of job applications with status deleted
const jobApplicationsDeletedCounter = meter.createCounter("job_applications_deleted_counter", {
  description: "Counts the number of job applications with status 'deleted'",
});

// Metric for counting the number of job applications with status rejected
const jobApplicationsRejectedCounter = meter.createCounter("job_applications_rejected_counter", {
  description: "Counts the number of job applications with status 'rejected'",
});

// Metric for counting the number of job applications with status cancelled
const jobApplicationsCancelledCounter = meter.createCounter("job_applications_cancelled_counter", {
  description: "Counts the number of job applications with status 'cancelled'",
});

// Metric for counting the number of job applications with status finished
const jobApplicationsFinishedCounter = meter.createCounter("job_applications_finished_counter", {
  description: "Counts the number of job applications with status 'finished'",
});

// Metric for counting the number of job applications with status deleted
const jobApplicationsDeletedCounter = meter.createCounter("job_applications_deleted_counter", {
  description: "Counts the number of job applications with status 'deleted'",
});

// Metric for counting the number of job applications with status applied
const jobApplicationsAppliedCounter = meter.createCounter("job_applications_applied_counter", {
  description: "Counts the number of job applications with status 'applied'",
});

// Metric for counting the number of job applications with status accepted
const jobApplicationsAcceptedCounter = meter.createCounter("job_applications_accepted_counter", {
  description: "Counts the number of job applications with status 'accepted'",
});

// Metric for counting the number of job applications with status rejected
const jobApplicationsRejectedCounter = meter.createCounter("job_applications_rejected_counter", {
  description: "Counts the number of job applications with status 'rejected'",
});

// Metric for counting the number of job applications with status cancelled
const jobApplicationsCancelledCounter = meter.createCounter("job_applications_cancelled_counter", {
  description: "Counts the number of job applications with status 'cancelled'",
});

// Metric for counting the number of job applications with status finished
const jobApplicationsFinishedCounter = meter.createCounter("job_applications_finished_counter", {
  description: "Counts the number of job applications with status 'finished'",
});

// Metric for counting the number of job applications with status deleted
const jobApplicationsDeletedCounter = meter.createCounter("job_applications_deleted_counter", {
  description: "Counts the number of job applications with status 'deleted'",
});

// Metric for counting the number of job applications with status rejected
const jobApplicationsRejectedCounter = meter.createCounter("job_applications_rejected_counter", {
  description: "Counts the number of job applications with status 'rejected'",
});

// Metric for counting the number of job applications with status cancelled
const jobApplicationsCancelledCounter = meter.createCounter("job_applications_cancelled_counter", {
  description: "Counts the number of job applications with status 'cancelled'",
});

// Metric for counting the number of job applications with status finished
const jobApplicationsFinishedCounter = meter.createCounter("job_applications_finished_counter", {
  description: "Counts the number of job applications with status 'finished'",
});

// Metric for counting the number of job applications with status deleted
const jobApplicationsDeletedCounter = meter.createCounter("job_applications_deleted_counter", {
  description: "Counts the number of job applications with status 'deleted'",
});

// Metric for counting the number of job applications with status applied
const jobApplicationsAppliedCounter = meter.createCounter("job_applications_applied_counter", {
  description: "Counts the number of job applications with status 'applied'",
});

// Metric for counting the number of job applications with status accepted
const jobApplicationsAcceptedCounter = meter.createCounter("job_applications_accepted_counter", {
  description: "Counts the number of job applications with status 'accepted'",
});

// Metric for counting the number of job applications with status rejected
const jobApplicationsRejectedCounter = meter.createCounter("job_applications_rejected_counter", {
  description: "Counts the number of job applications with status 'rejected'",
});

// Metric for counting the number of job applications with status cancelled
const jobApplicationsCancelledCounter = meter.createCounter("job_applications_cancelled_counter", {
  description: "Counts the number of job applications with status 'cancelled'",
});

// Metric for counting the number of job applications with status finished
const jobApplicationsFinishedCounter = meter.createCounter("job_applications_finished_counter", {
  description: "Counts the number of job applications with status 'finished'",
});

// Metric for counting the number of job applications with status deleted
const jobApplicationsDeletedCounter = meter.createCounter("job_applications_deleted_counter", {
  description: "Counts the number of job applications with status 'deleted'",
});

// Metric for counting the number of job applications with status rejected
const jobApplicationsRejectedCounter = meter.createCounter("job_applications_rejected_counter", {
  description: "Counts the number of job applications with status 'rejected'",
});

// Metric for counting the number of job applications with status cancelled
const jobApplicationsCancelledCounter = meter.createCounter("job_applications_cancelled_counter", {
  description: "Counts the number of job applications with status 'cancelled'",
});

// Metric for counting the number of job applications with status finished
const jobApplicationsFinishedCounter = meter.createCounter("job_applications_finished_counter", {
  description: "Counts the number of job applications with status 'finished'",
});

// Metric for counting the number of job applications with status deleted
const jobApplicationsDeletedCounter = meter.createCounter("job_applications_deleted_counter", {
  description: "Counts the number of job applications with status 'deleted'",
});

// Metric for counting the number of job applications with status applied
const jobApplicationsAppliedCounter = meter.createCounter("job_applications_applied_counter", {
  description: "Counts the number of job applications with status 'applied'",
});

// Metric for counting the number of job applications with status accepted
const jobApplicationsAcceptedCounter = meter.createCounter("job_applications_accepted_counter", {
  description: "Counts the number of job applications with status 'accepted'",
});

// Metric for counting the number of job applications with status rejected
const jobApplicationsRejectedCounter = meter.createCounter("job_applications_rejected_counter", {
  description: "Counts the number of job applications with status 'rejected'",
});

// Metric for counting the number of job applications with status cancelled
const jobApplicationsCancelledCounter = meter.createCounter("job_applications_cancelled_counter", {
  description: "Counts the number of job applications with status 'cancelled'",
});

// Metric for counting the number of job applications with status finished
const jobApplicationsFinishedCounter = meter.createCounter("job_applications_finished_counter", {
  description: "Counts the number of job applications with status 'finished'",
});

// Metric for counting the number of job applications with status deleted
const jobApplicationsDeletedCounter = meter.createCounter("job_applications_deleted_counter", {
  description: "Counts the number of job applications with status 'deleted'",
});

// Metric for counting the number of job applications with status rejected
const jobApplicationsRejectedCounter = meter.createCounter("job_applications_rejected_counter", {
  description: "Counts the number of job applications with status 'rejected'",
});

// Metric for counting the number of job applications with status cancelled
const jobApplicationsCancelledCounter = meter.createCounter("job_applications_cancelled_counter", {
  description: "Counts the number of job applications with status 'cancelled'",
});

// Metric for counting the number of job applications with status finished
const jobApplicationsFinishedCounter = meter.createCounter("job_applications_finished_counter", {
  description: "Counts the number of job applications with status 'finished'",
});

// Metric for counting the number of job applications with status deleted
const jobApplicationsDeletedCounter = meter.createCounter("job_applications_deleted_counter", {
  description: "Counts the number of job applications with status 'deleted'",
});

// Metric for counting the number of job applications with status applied
const jobApplicationsAppliedCounter = meter.createCounter("job_applications_applied_counter", {
  description: "Counts the number of job applications with status 'applied'",
});

// Metric for counting the number of job applications with status accepted
const jobApplicationsAcceptedCounter = meter.createCounter("job_applications_accepted_counter", {
  description: "Counts the number of job applications with status 'accepted'",
});

// Metric for counting the number of job applications with status rejected
const jobApplicationsRejectedCounter = meter.createCounter("job_applications_rejected_counter", {
  description: "Counts the number of job applications with status 'rejected'",
});

// Metric for counting the number of job applications with status cancelled
const jobApplicationsCancelledCounter = meter.createCounter("job_applications_cancelled_counter", {
  description: "Counts the number of job applications with status 'cancelled'",
});

// Metric for counting the number of job applications with status finished
const jobApplicationsFinishedCounter = meter.createCounter("job_applications_finished_counter", {
  description: "Counts the number of job applications with status 'finished'",
});

// Metric for counting the number of job applications with status deleted
const jobApplicationsDeletedCounter = meter.createCounter("job_applications_deleted_counter", {
  description: "Counts the number of job applications with status 'deleted'",
});

// Metric for counting the number of job applications with status rejected
const jobApplicationsRejectedCounter = meter.createCounter("job_applications_rejected_counter", {
  description: "Counts the number of job applications with status 'rejected'",
});

// Metric for counting the number of job applications with status cancelled
const jobApplicationsCancelledCounter = meter.createCounter("job_applications_cancelled_counter", {
  description: "Counts the number of job applications with status 'cancelled'",
});

// Metric for counting the number of job applications with status finished
const jobApplicationsFinishedCounter = meter.createCounter("job_applications_finished_counter", {
  description: "Counts the number of job applications with status 'finished'",
});

// Metric for counting the number of job applications with status deleted
const jobApplications