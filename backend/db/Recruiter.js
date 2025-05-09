const mongoose = require("mongoose");
const { diag, DiagConsoleLogger, DiagLogLevel } = require('@opentelemetry/api');

// Set up OpenTelemetry diagnostics logger
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
    contactNumber: {
      type: String,
      validate: {
        validator: function (v) {
          const isValid = v !== "" ? /\+\d{1,3}\d{10}/.test(v) : true;
          diag.info(`Validating contact number: ${v}, isValid: ${isValid}`);
          return isValid;
        },
        msg: "Phone number is invalid!",
      },
    },
    bio: {
      type: String,
    },
  },
  { collation: { locale: "en" } }
);

diag.info('Mongoose schema created with collation locale: en');

module.exports = mongoose.model("RecruiterInfo", schema);

diag.info('Mongoose model "RecruiterInfo" created and exported');
