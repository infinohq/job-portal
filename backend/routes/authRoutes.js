const express = require("express");
const passport = require("passport");
const jwt = require("jsonwebtoken");
const authKeys = require("../lib/authKeys");
const { trace, metrics } = require('@opentelemetry/api');

const User = require("../db/User");
const JobApplicant = require("../db/JobApplicant");
const Recruiter = require("../db/Recruiter");

const router = express.Router();

const meter = metrics.getMeter('default');

const signupCounter = meter.createCounter('signup');
const loginCounter = meter.createCounter('login');
const signupErrorCounter = meter.createCounter('signupError');
const loginErrorCounter = meter.createCounter('loginError');

router.post("/signup", (req, res) => {
  const data = req.body;
  let user = new User({
    email: data.email,
    password: data.password,
    type: data.type,
  });

  trace.getTracer('default').startSpan('signup: create user', {
    attributes: { email: data.email, type: data.type },
  });

  user
    .save()
    .then(() => {
      signupCounter.add(1);

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

      trace.getTracer('default').startSpan('signup: create user details', {
        attributes: { userId: user._id, type: user.type },
      });

      userDetails
        .save()
        .then(() => {
          // Token
          const token = jwt.sign({ _id: user._id }, authKeys.jwtSecretKey);
          res.json({
            token: token,
            type: user.type,
          });
        })
        .catch((err) => {
          signupErrorCounter.add(1);

          trace.getTracer('default').startSpan('signup: delete user on error', {
            attributes: { userId: user._id, error: err },
          });

          user
            .delete()
            .then(() => {
              res.status(400).json(err);
            })
            .catch((err) => {
              res.json({ error: err });
            });
          err;
        });
    })
    .catch((err) => {
      signupErrorCounter.add(1);
      res.status(400).json(err);
    });
});

router.post("/login", (req, res, next) => {
  passport.authenticate(
    "local",
    { session: false },
    function (err, user, info) {
      if (err) {
        loginErrorCounter.add(1);

        trace.getTracer('default').startSpan('login: error', {
          attributes: { error: err },
        });
        return next(err);
      }
      if (!user) {
        res.status(401).json(info);
        return;
      }
      loginCounter.add(1);
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
