const express = require("express");
const passport = require("passport");
const jwt = require("jsonwebtoken");
const authKeys = require("../lib/authKeys");
const { trace } = require("@opentelemetry/api");

const User = require("../db/User");
const JobApplicant = require("../db/JobApplicant");
const Recruiter = require("../db/Recruiter");

const router = express.Router();

router.post("/signup", (req, res) => {
  const tracer = trace.getTracer("default");
  const span = tracer.startSpan("signup");
  const data = req.body;
  span.addEvent("Received signup request", { data });

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
          // Token
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
      res.status(400).json(err);
      span.end();
    });
});

router.post("/login", (req, res, next) => {
  const tracer = trace.getTracer("default");
  const span = tracer.startSpan("login");
  span.addEvent("Received login request", { body: req.body });

  passport.authenticate(
    "local",
    { session: false },
    function (err, user, info) {
      if (err) {
        span.addEvent("Error during authentication", { error: err });
        span.end();
        return next(err);
      }
      if (!user) {
        span.addEvent("Authentication failed", { info });
        res.status(401).json(info);
        span.end();
        return;
      }
      // Token
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