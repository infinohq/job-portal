const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
require("mongoose-type-email");
const { diag } = require('@opentelemetry/api');

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

  // if the data is not modified
  if (!user.isModified("password")) {
    diag.debug('Password not modified for user:', user.email);
    return next();
  }

  bcrypt.hash(user.password, 10, (err, hash) => {
    if (err) {
      diag.error('Error hashing password for user:', user.email, err);
      return next(err);
    }
    diag.debug('Password hashed successfully for user:', user.email);
    user.password = hash;
    next();
  });
});

// Password verification upon login
schema.methods.login = function (password) {
  let user = this;

  return new Promise((resolve, reject) => {
    bcrypt.compare(password, user.password, (err, result) => {
      if (err) {
        diag.error('Error comparing password for user:', user.email, err);
        reject(err);
      }
      if (result) {
        diag.debug('Password verification successful for user:', user.email);
        resolve();
      } else {
        diag.debug('Password verification failed for user:', user.email);
        reject();
      }
    });
  });
};

module.exports = mongoose.model("UserAuth", schema);
