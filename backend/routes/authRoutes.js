const express = require("express");
const passport = require("passport");
const jwt = require("jsonwebtoken");
const authKeys = require("../lib/authKeys");
const { diag, metrics } = require('@opentelemetry/api');

const User = require("../db/User");
const JobApplicant = require("../db/JobApplicant");
const Recruiter = require("../db/Recruiter");

const router = express.Router();

const signupCounter = metrics.getMeter('default').createCounter('signup_requests', {
  description: 'Count of signup requests'
});
const signupErrorRate = metrics.getMeter('default').createCounter('signup_errors', {
  description: 'Count of signup errors'
});

router.post("/signup", (req, res) => {
  signupCounter.add(1);
  const data = req.body;
  diag.info('Received signup request', { data });

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
          diag.info('User details saved successfully', { userId: user._id });

          const token = jwt.sign({ _id: user._id }, authKeys.jwtSecretKey);
          diag.info('JWT token generated', { token });

          res.json({
            token: token,
            type: user.type,
          });
        })
        .catch((err) => {
          signupErrorRate.add(1);
          diag.error('Error saving user details', { error: err });

          user
            .delete()
            .then(() => {
              diag.info('User deleted after error in saving details', { userId: user._id });
              res.status(400).json(err);
            })
            .catch((err) => {
              signupErrorRate.add(1);
              diag.error('Error deleting user after failed details save', { error: err });
              res.json({ error: err });
            });
          err;
        });
    })
    .catch((err) => {
      signupErrorRate.add(1);
      diag.error('Error saving user', { error: err });
      res.status(400).json(err);
    });
});

const loginCounter = metrics.getMeter('default').createCounter('login_requests', {
  description: 'Count of login requests'
});
const loginErrorRate = metrics.getMeter('default').createCounter('login_errors', {
  description: 'Count of login errors'
});

router.post("/login", (req, res, next) => {
  loginCounter.add(1);
  diag.info('Received login request', { body: req.body });

  passport.authenticate(
    "local",
    { session: false },
    function (err, user, info) {
      if (err) {
        loginErrorRate.add(1);
        diag.error('Error during authentication', { error: err });
        return next(err);
      }
      if (!user) {
        loginErrorRate.add(1);
        diag.info('Authentication failed', { info });
        res.status(401).json(info);
        return;
      }
      diag.info('User authenticated successfully', { userId: user._id });

      const token = jwt.sign({ _id: user._id }, authKeys.jwtSecretKey);
      diag.info('JWT token generated', { token });

      res.json({
        token: token,
        type: user.type,
      });
    }
  )(req, res, next);
});

module.exports = router;
