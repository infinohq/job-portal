const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const { diag, DiagConsoleLogger, DiagLogLevel } = require('@opentelemetry/api');

// Set up OpenTelemetry diagnostics
diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.ALL);

require("mongoose-type-email");

let schema = new mongoose.Schema(
  {
    email: {
      type: mongoose.SchemaTypes.Email,
      unique: true,
      lowercase: true,
      required: true,
    },
    password: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ["recruiter", "applicant"],
      required: true,
    },
  },
  { collation: { locale: "en" } }
);

// Password hashing
schema.pre("save", function (next) {
  let user = this;
  diag.debug('Pre-save hook triggered', { email: user.email });

  // if the data is not modified
  if (!user.isModified("password")) {
    diag.debug('Password not modified', { email: user.email });
    return next();
  }

  bcrypt.hash(user.password, 10, (err, hash) => {
    if (err) {
      diag.error('Error hashing password', { email: user.email, error: err });
      return next(err);
    }
    diag.debug('Password hashed successfully', { email: user.email });
    user.password = hash;
    next();
  });
});

// Password verification upon login
schema.methods.login = function (password) {
  let user = this;
  diag.debug('Login method called', { email: user.email });

  return new Promise((resolve, reject) => {
    bcrypt.compare(password, user.password, (err, result) => {
      if (err) {
        diag.error('Error comparing password', { email: user.email, error: err });
        reject(err);
      }
      if (result) {
        diag.debug('Password comparison successful', { email: user.email });
        resolve();
      } else {
        diag.debug('Password comparison failed', { email: user.email });
        reject();
      }
    });
  });
};

module.exports = mongoose.model("UserAuth", schema);