const mongoose = require("mongoose");
console.log("Mongoose module required");

const bcrypt = require("bcrypt");
console.log("Bcrypt module required");

require("mongoose-type-email");
console.log("Mongoose type email required");

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
console.log("Schema created");

// Password hashing
schema.pre("save", function (next) {
  let user = this;

  // if the data is not modified
  if (!user.isModified("password")) {
    console.log("Password not modified, moving to the next middleware");
    return next();
  }

  bcrypt.hash(user.password, 10, (err, hash) => {
    if (err) {
      console.error("Error hashing password:", err);
      return next(err);
    }
    user.password = hash;
    console.log("Password hashed successfully");
    next();
  });
});

// Password verification upon login
schema.methods.login = function (password) {
  let user = this;

  return new Promise((resolve, reject) => {
    bcrypt.compare(password, user.password, (err, result) => {
      if (err) {
        console.error("Error comparing passwords:", err);
        reject(err);
      }
      if (result) {
        console.log("Password verification successful");
        resolve();
      } else {
        console.log("Password verification failed");
        reject();
      }
    });
  });
};

module.exports = mongoose.model("UserAuth", schema);
console.log("UserAuth model exported");