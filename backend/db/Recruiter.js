const mongoose = require("mongoose");
const { diag } = require('@opentelemetry/api');

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
          diag.debug(`Validating contact number: ${v}, isValid: ${isValid}`);
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

diag.debug('Schema created with collation locale: en');

module.exports = mongoose.model("RecruiterInfo", schema);
