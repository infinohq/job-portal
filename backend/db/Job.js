const mongoose = require("mongoose");
const { diag, DiagConsoleLogger, DiagLogLevel } = require('@opentelemetry/api');
const { MeterProvider } = require('@opentelemetry/sdk-metrics-base');

// Set up OpenTelemetry diagnostics logger
diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.INFO);

// Set up OpenTelemetry MeterProvider
const meter = new MeterProvider().getMeter('job-metrics');

// Define business metrics
const jobPostingsCounter = meter.createCounter('job_postings', {
  description: 'Count of job postings created',
});

const activeApplicationsGauge = meter.createObservableGauge('active_applications', {
  description: 'Current number of active applications',
});

const acceptedCandidatesGauge = meter.createObservableGauge('accepted_candidates', {
  description: 'Current number of accepted candidates',
});

const totalSalaryCounter = meter.createCounter('total_salary', {
  description: 'Total salary offered across all job postings',
});

let schema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    maxApplicants: {
      type: Number,
      validate: [
        {
          validator: Number.isInteger,
          msg: "maxApplicants should be an integer",
        },
        {
          validator: function (value) {
            diag.info(`Validating maxApplicants: ${value}`);
            return value > 0;
          },
          msg: "maxApplicants should greater than 0",
        },
      ],
    },
    maxPositions: {
      type: Number,
      validate: [
        {
          validator: Number.isInteger,
          msg: "maxPostions should be an integer",
        },
        {
          validator: function (value) {
            diag.info(`Validating maxPositions: ${value}`);
            return value > 0;
          },
          msg: "maxPositions should greater than 0",
        },
      ],
    },
    activeApplications: {
      type: Number,
      default: 0,
      validate: [
        {
          validator: Number.isInteger,
          msg: "activeApplications should be an integer",
        },
        {
          validator: function (value) {
            diag.info(`Validating activeApplications: ${value}`);
            return value >= 0;
          },
          msg: "activeApplications should greater than equal to 0",
        },
      ],
    },
    acceptedCandidates: {
      type: Number,
      default: 0,
      validate: [
        {
          validator: Number.isInteger,
          msg: "acceptedCandidates should be an integer",
        },
        {
          validator: function (value) {
            diag.info(`Validating acceptedCandidates: ${value}`);
            return value >= 0;
          },
          msg: "acceptedCandidates should greater than equal to 0",
        },
      ],
    },
    dateOfPosting: {
      type: Date,
      default: Date.now,
    },
    deadline: {
      type: Date,
      validate: [
        {
          validator: function (value) {
            diag.info(`Validating deadline: ${value} against dateOfPosting: ${this.dateOfPosting}`);
            return this.dateOfPosting < value;
          },
          msg: "deadline should be greater than dateOfPosting",
        },
      ],
    },
    skillsets: [String],
    jobType: {
      type: String,
      required: true,
    },
    duration: {
      type: Number,
      min: 0,
      validate: [
        {
          validator: Number.isInteger,
          msg: "Duration should be an integer",
        },
      ],
    },
    salary: {
      type: Number,
      validate: [
        {
          validator: Number.isInteger,
          msg: "Salary should be an integer",
        },
        {
          validator: function (value) {
            diag.info(`Validating salary: ${value}`);
            return value >= 0;
          },
          msg: "Salary should be positive",
        },
      ],
    },
    rating: {
      type: Number,
      max: 5.0,
      default: -1.0,
      validate: {
        validator: function (v) {
          diag.info(`Validating rating: ${v}`);
          return v >= -1.0 && v <= 5.0;
        },
        msg: "Invalid rating",
      },
    },
  },
  { collation: { locale: "en" } }
);

// Increment job postings counter when a new job is created
schema.post('save', function (doc) {
  jobPostingsCounter.add(1);
  totalSalaryCounter.add(doc.salary);
});

// Update gauges for active applications and accepted candidates
activeApplicationsGauge.addCallback((observableResult) => {
  observableResult.observe(this.activeApplications);
});

acceptedCandidatesGauge.addCallback((observableResult) => {
  observableResult.observe(this.acceptedCandidates);
});

module.exports = mongoose.model("jobs", schema);
