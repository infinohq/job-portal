const express = require("express");
const passport = require("passport");
const jwt = require("jsonwebtoken");
const authKeys = require("../lib/authKeys");
const { diag, DiagConsoleLogger, DiagLogLevel } = require('@opentelemetry/api');

// Set up OpenTelemetry diagnostics
diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.ALL);

const User = require("../db/User");
const JobApplicant = require("../db/JobApplicant");
const Recruiter = require("../db/Recruiter");

const router = express.Router();

router.post("/signup", (req, res) => {
  diag.info('Received signup request', { body: req.body });
  const data = req.body;
  let user = new User({
    email: data.email,
    password: data.password,
    type: data.type,
  });

  user
    .save()
    .then(() => {
      diag.info('User saved successfully', { userId: user._id });
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
          diag.info('User details saved successfully', { userId: user._id, userType: user.type });
          // Token
          const token = jwt.sign({ _id: user._id }, authKeys.jwtSecretKey);
          res.json({
            token: token,
            type: user.type,
          });
        })
        .catch((err) => {
          diag.error('Error saving user details', { error: err });
          user
            .delete()
            .then(() => {
              diag.info('User deleted after failure to save details', { userId: user._id });
              res.status(400).json(err);
            })
            .catch((err) => {
              diag.error('Error deleting user after failure to save details', { error: err });
              res.json({ error: err });
            });
          err;
        });
    })
    .catch((err) => {
      diag.error('Error saving user', { error: err });
      res.status(400).json(err);
    });
});

router.post("/login", (req, res, next) => {
  diag.info('Received login request', { body: req.body });
  passport.authenticate(
    "local",
    { session: false },
    function (err, user, info) {
      if (err) {
        diag.error('Error during authentication', { error: err });
        return next(err);
      }
      if (!user) {
        diag.warn('Authentication failed', { info: info });
        res.status(401).json(info);
        return;
      }
      diag.info('User authenticated successfully', { userId: user._id });
      // Token
      const token = jwt.sign({ _id: user._id }, authKeys.jwtSecretKey);
      res.json({
        token: token,
        type: user.type,
      });
    }
  )(req, res, next);
});

module.exports = router;