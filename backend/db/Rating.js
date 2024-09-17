const mongoose = require("mongoose");
const { diag, DiagConsoleLogger, DiagLogLevel } = require('@opentelemetry/api');

// Set up the logger
diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.INFO);

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
          const isValid = v >= -1.0 && v <= 5.0;
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

module.exports = mongoose.model("ratings", schema);
diag.info('Mongoose model "ratings" created and exported');
