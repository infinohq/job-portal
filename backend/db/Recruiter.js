const mongoose = require("mongoose");
const { diag, DiagConsoleLogger, DiagLogLevel } = require('@opentelemetry/api');

// Set up OpenTelemetry diagnostics
diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.ALL);

diag.info('Initializing mongoose schema for RecruiterInfo');

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
          diag.debug('Validating contact number');
          const isValid = v !== "" ? /\+\d{1,3}\d{10}/.test(v) : true;
          if (!isValid) {
            diag.warn('Phone number is invalid!');
          }
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

diag.info('Mongoose schema for RecruiterInfo initialized successfully');

module.exports = mongoose.model("RecruiterInfo", schema);

diag.info('RecruiterInfo model exported successfully');