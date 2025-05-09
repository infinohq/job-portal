const mongoose = require("mongoose");
const { diag, DiagConsoleLogger, DiagLogLevel } = require('@opentelemetry/api');

// Set up OpenTelemetry diagnostics
diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.ALL);

diag.info('Initializing Mongoose schema for ratings');

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
          diag.debug(`Validating rating: ${v}`);
          return v >= -1.0 && v <= 5.0;
        },
        msg: "Invalid rating",
      },
    },
  },
  { collation: { locale: "en" } }
);

diag.info('Creating index for schema');
schema.index({ category: 1, receiverId: 1, senderId: 1 }, { unique: true });

diag.info('Exporting Mongoose model for ratings');
module.exports = mongoose.model("ratings", schema);