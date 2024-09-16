const { trace } = require("@opentelemetry/api");

const tracer = trace.getTracer("user-auth-logger");

const log = (message) => {
  tracer.getCurrentSpan().addEvent(message);
};

const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
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

schema.pre("save", function (next) {
  let user = this;

  if (!user.isModified("password")) {
    log("Password not modified, skipping hashing");
    return next();
  }

  bcrypt.hash(user.password, 10, (err, hash) => {
    if (err) {
      log("Error hashing password");
      return next(err);
    }
    user.password = hash;
    log("Password hashed successfully");
    next();
  });
});

schema.methods.login = function (password) {
  let user = this;

  return new Promise((resolve, reject) => {
    bcrypt.compare(password, user.password, (err, result) => {
      if (err) {
        log("Error comparing passwords");
        reject(err);
      }
      if (result) {
        log("Password verification successful");
        resolve();
      } else {
        log("Password verification failed");
        reject();
      }
    });
  });
};

module.exports = mongoose.model("UserAuth", schema);