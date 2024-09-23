const mongoose = require("mongoose");
const { diag, DiagConsoleLogger, DiagLogLevel } = require('@opentelemetry/api');

// Set up a logger
diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.INFO);

let schema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    education: [
      {
        institutionName: {
          type: String,
          required: true,
        },
        startYear: {
          type: Number,
          min: 1930,
          max: new Date().getFullYear(),
          required: true,
          validate: Number.isInteger,
        },
        endYear: {
          type: Number,
          max: new Date().getFullYear(),
          validate: [
            { validator: Number.isInteger, msg: "Year should be an integer" },
            {
              validator: function (value) {
                const isValid = this.startYear <= value;
                diag.info(`Validating endYear: ${value}, startYear: ${this.startYear}, isValid: ${isValid}`);
                return isValid;
              },
              msg: "End year should be greater than or equal to Start year",
            },
          ],
        },
      },
    ],
    skills: [String],
    rating: {
      type: Number,
      max: 5.0,
      default: -1.0,
      validate: {
        validator: function (v) {
          const isValid = v >= -1.0 && v <= 5.0;
          diag.info(`Validating rating: ${v}, isValid: ${isValid}`);
          return isValid;
        },
        msg: "Invalid rating",
      },
    },
    resume: {
      type: String,
    },
    profile: {
      type: String,
    },
  },
  { collation: { locale: "en" } }
);

diag.info('Schema for JobApplicantInfo created');

module.exports = mongoose.model("JobApplicantInfo", schema);
