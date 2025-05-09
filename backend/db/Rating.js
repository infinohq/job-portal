const mongoose = require("mongoose");
const { diag, DiagConsoleLogger, DiagLogLevel } = require('@opentelemetry/api');
const { MeterProvider } = require('@opentelemetry/sdk-metrics-base');
const express = require('express');
const app = express();
const port = 3000;

// Set up the logger
diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.INFO);

// Set up OpenTelemetry MeterProvider
const meter = new MeterProvider().getMeter('business-metrics');

// Define metrics
const ratingValidationCounter = meter.createCounter('rating_validation_attempts', {
  description: 'Count of rating validation attempts',
});

const ratingValidationSuccessCounter = meter.createCounter('rating_validation_successes', {
  description: 'Count of successful rating validations',
});

const ratingValidationFailureCounter = meter.createCounter('rating_validation_failures', {
  description: 'Count of failed rating validations',
});

const ratingSubmissionCounter = meter.createCounter('rating_submissions', {
  description: 'Count of rating submissions',
});

let schema = new mongoose.Schema(
  {
    category: {
      type: String,
      enum: ["job", "applicant"],
      required: true,
    },
    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    rating: {
      type: Number,
      max: 5.0,
      default: -1.0,
      validate: {
        validator: function (v) {
          ratingValidationCounter.add(1);
          const isValid = v >= -1.0 && v <= 5.0;
          if (isValid) {
            ratingValidationSuccessCounter.add(1);
          } else {
            ratingValidationFailureCounter.add(1);
          }
          diag.info(`Validating rating: ${v}, isValid: ${isValid}`);
          return isValid;
        },
        msg: "Invalid rating",
      },
    },
  },
  { collation: { locale: "en" } }
);

diag.info('Schema created with collation: { locale: "en" }');

schema.index({ category: 1, receiverId: 1, senderId: 1 }, { unique: true });
diag.info('Index created on schema: { category: 1, receiverId: 1, senderId: 1 }, { unique: true }');

const Rating = mongoose.model("ratings", schema);
diag.info('Mongoose model "ratings" created and exported');

app.post('/submit-rating', (req, res) => {
  const { category, receiverId, senderId, rating } = req.body;
  const newRating = new Rating({ category, receiverId, senderId, rating });
  newRating.save((err) => {
    if (err) {
      res.status(500).send('Error saving rating');
    } else {
      ratingSubmissionCounter.add(1);
      res.status(200).send('Rating submitted successfully');
    }
  });
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}/`);
});
