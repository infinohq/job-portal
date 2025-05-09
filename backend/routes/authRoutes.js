const express = require("express");
const passport = require("passport");
const jwt = require("jsonwebtoken");
const authKeys = require("../lib/authKeys");
const { diag } = require('@opentelemetry/api');

const User = require("../db/User");
const JobApplicant = require("../db/JobApplicant");
const Recruiter = require("../db/Recruiter");

const router = express.Router();

router.post("/signup", (req, res) => {
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

          // Token
          const token = jwt.sign({ _id: user._id }, authKeys.jwtSecretKey);
          diag.info('JWT token generated', { token });

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
              diag.info('User deleted after error in saving details', { userId: user._id });
              res.status(400).json(err);
            })
            .catch((err) => {
              diag.error('Error deleting user after failed details save', { error: err });
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
        diag.info('Authentication failed', { info });
        res.status(401).json(info);
        return;
      }
      diag.info('User authenticated successfully', { userId: user._id });

      // Token
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
