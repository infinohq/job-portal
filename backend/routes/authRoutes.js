const express = require("express");
const passport = require("passport");
const jwt = require("jsonwebtoken");
const authKeys = require("../lib/authKeys");
const { trace, metrics } = require("@opentelemetry/api");

const User = require("../db/User");
const JobApplicant = require("../db/JobApplicant");
const Recruiter = require("../db/Recruiter");

const router = express.Router();

const meter = metrics.getMeter("default");
const signupCounter = meter.createCounter("signup_requests", {
  description: "Count of signup requests",
});
const loginCounter = meter.createCounter("login_requests", {
  description: "Count of login requests",
});
const signupErrorCounter = meter.createCounter("signup_errors", {
  description: "Count of signup errors",
});
const loginErrorCounter = meter.createCounter("login_errors", {
  description: "Count of login errors",
});

router.post("/signup", (req, res) => {
  const tracer = trace.getTracer("default");
  const span = tracer.startSpan("signup");
  const data = req.body;
  span.addEvent("Received signup request", { data });

  signupCounter.add(1);

  let user = new User({
    email: data.email,
    password: data.password,
    type: data.type,
  });

  user
    .save()
    .then(() => {
      span.addEvent("User saved", { userId: user._id });
      const userDetails =
        user.type == "recruiter"
          ? new Recruiter({
              userId: user._id,
              name: data.name,
              contactNumber: data.contactNumber,
              bio: data.bio,
            })
          : new JobApplicant({
              userId: user._id,
              name: data.name,
              education: data.education,
              skills: data.skills,
              rating: data.rating,
              resume: data.resume,
              profile: data.profile,
            });

      userDetails
        .save()
        .then(() => {
          span.addEvent("User details saved", { userDetailsId: userDetails._id });
          const token = jwt.sign({ _id: user._id }, authKeys.jwtSecretKey);
          span.addEvent("JWT token generated", { token });
          res.json({
            token: token,
            type: user.type,
          });
          span.end();
        })
        .catch((err) => {
          span.addEvent("Error saving user details", { error: err });
          signupErrorCounter.add(1);
          user
            .delete()
            .then(() => {
              span.addEvent("User deleted after error", { userId: user._id });
              res.status(400).json(err);
              span.end();
            })
            .catch((err) => {
              span.addEvent("Error deleting user", { error: err });
              res.json({ error: err });
              span.end();
            });
        });
    })
    .catch((err) => {
      span.addEvent("Error saving user", { error: err });
      signupErrorCounter.add(1);
      res.status(400).json(err);
      span.end();
    });
});

router.post("/login", (req, res, next) => {
  const tracer = trace.getTracer("default");
  const span = tracer.startSpan("login");
  span.addEvent("Received login request", { body: req.body });

  loginCounter.add(1);

  passport.authenticate(
    "local",
    { session: false },
    function (err, user, info) {
      if (err) {
        span.addEvent("Error during authentication", { error: err });
        loginErrorCounter.add(1);
        span.end();
        return next(err);
      }
      if (!user) {
        span.addEvent("Authentication failed", { info });
        loginErrorCounter.add(1);
        res.status(401).json(info);
        span.end();
        return;
      }
      const token = jwt.sign({ _id: user._id }, authKeys.jwtSecretKey);
      span.addEvent("JWT token generated", { token });
      res.json({
        token: token,
        type: user.type,
      });
      span.end();
    }
  )(req, res, next);
});

module.exports = router;
