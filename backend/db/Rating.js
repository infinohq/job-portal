const { diag, DiagConsoleLogger, DiagLogLevel } = require("@opentelemetry/api");

diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.ALL);

diag.debug("Setting up logging for ratings model.");

const mongoose = require("mongoose");

diag.debug("Creating schema for ratings model.");

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
          return v >= -1.0 && v <= 5.0;
        },
        msg: "Invalid rating",
      },
    },
  },
  { collation: { locale: "en" } }
);

diag.debug("Creating index for ratings model.");

schema.index({ category: 1, receiverId: 1, senderId: 1 }, { unique: true });

diag.debug("Rating model schema created successfully.");

module.exports = mongoose.model("ratings", schema);