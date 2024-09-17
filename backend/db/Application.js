const mongoose = require("mongoose");
const { diag, DiagConsoleLogger, DiagLogLevel } = require('@opentelemetry/api');
const { MeterProvider } = require('@opentelemetry/sdk-metrics-base');

// Set up OpenTelemetry diagnostics
diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.ALL);

// Set up OpenTelemetry MeterProvider
const meter = new MeterProvider().getMeter('application-metrics');

// Define metrics
const applicationStatusCounter = meter.createCounter('application_status_count', {
  description: 'Count of applications by status',
});

const applicationDateOfJoiningGauge = meter.createObservableGauge('application_date_of_joining', {
  description: 'Gauge for date of joining of applications',
});

const sopWordCountHistogram = meter.createHistogram('sop_word_count', {
  description: 'Histogram of SOP word counts',
});

let schema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    recruiterId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    status: {
      type: String,
      enum: [
        "applied", // when a applicant is applied
        "shortlisted", // when a applicant is shortlisted
        "accepted", // when a applicant is accepted
        "rejected", // when a applicant is rejected
        "deleted", // when any job is deleted
        "cancelled", // an application is cancelled by its author or when other application is accepted
        "finished", // when job is over
      ],
      default: "applied",
      required: true,
    },
    dateOfApplication: {
      type: Date,
      default: Date.now,
    },
    dateOfJoining: {
      type: Date,
      validate: [
        {
          validator: function (value) {
            const isValid = this.dateOfApplication <= value;
            diag.debug(`Validating dateOfJoining: ${value}, dateOfApplication: ${this.dateOfApplication}, isValid: ${isValid}`);
            return isValid;
          },
          msg: "dateOfJoining should be greater than dateOfApplication",
        },
      ],
    },
    sop: {
      type: String,
      validate: {
        validator: function (v) {
          const wordCount = v.split(" ").filter((ele) => ele != "").length;
          const isValid = wordCount <= 250;
          diag.debug(`Validating SOP: wordCount: ${wordCount}, isValid: ${isValid}`);
          return isValid;
        },
        msg: "Statement of purpose should not be greater than 250 words",
      },
    },
  },
  { collation: { locale: "en" } }
);

schema.post('save', function (doc) {
  applicationStatusCounter.add(1, { status: doc.status });
  if (doc.dateOfJoining) {
    applicationDateOfJoiningGauge.add(doc.dateOfJoining.getTime());
  }
  if (doc.sop) {
    const wordCount = doc.sop.split(" ").filter((ele) => ele != "").length;
    sopWordCountHistogram.record(wordCount);
  }
});

module.exports = mongoose.model("applications", schema);
