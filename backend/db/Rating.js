const mongoose = require("mongoose");
const { diag } = require('@opentelemetry/api');

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
          diag.debug(`Validating rating: ${v}, isValid: ${isValid}`);
          return isValid;
        },
        msg: "Invalid rating",
      },
    },
  },
  { collation: { locale: "en" } }
);

diag.debug('Schema created with collation: en');

schema.index({ category: 1, receiverId: 1, senderId: 1 }, { unique: true });
diag.debug('Index created on schema with fields: category, receiverId, senderId');

module.exports = mongoose.model("ratings", schema);
diag.debug('Mongoose model "ratings" exported');
