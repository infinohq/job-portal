const express = require("express");
const passport = require("passport");
const jwt = require("jsonwebtoken");
const authKeys = require("../lib/authKeys");
const { diag } = require('@opentelemetry/api');
const { MeterProvider } = require('@opentelemetry/sdk-metrics-base');

const User = require("../db/User");
const JobApplicant = require("../db/JobApplicant");
const Recruiter = require("../db/Recruiter");

const router = express.Router();

const meterProvider = new MeterProvider();
const meter = meterProvider.getMeter('default');

const signupCounter = meter.createCounter('signup_requests', {
  description: 'Count of signup requests'
});
const signupErrorRate = meter.createCounter('signup_errors', {
  description: 'Count of signup errors'
});

const loginCounter = meter.createCounter('login_requests', {
  description: 'Count of login requests'
});
const loginErrorRate = meter.createCounter('login_errors', {
  description: 'Count of login errors'
});

router.post("/signup", (req, res) => {
  signupCounter.add(1);
  const data = req.body;
  diag.debug(`Received signup request with data: ${JSON.stringify(data)}`, {method: "POST", route: "/signup"});
  
  let user = new User({
    email: data.email,
    password: data.password,
    type: data.type,
  });

  user
    .save()
    .then(() => {
      diag.debug(`User saved successfully: ${JSON.stringify(user)}`, {method: "POST", route: "/signup", status: 200});
      
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
          diag.debug(`User details saved successfully: ${JSON.stringify(userDetails)}`, {method: "POST", route: "/signup", status: 200});
          
          const token = jwt.sign({ _id: user._id }, authKeys.jwtSecretKey);
          diag.debug(`JWT token generated: ${token}`, {method: "POST", route: "/signup", status: 200});
          
          res.json({
            token: token,
            type: user.type,
          });
        })
        .catch((err) => {
          signupErrorRate.add(1);
          diag.error(`Error saving user details: ${err}`, {method: "POST", route: "/signup", status: 400});
          
          user
            .delete()
            .then(() => {
              diag.debug(`User deleted after error in saving details: ${JSON.stringify(user)}`, {method: "POST", route: "/signup", status: 400});
              res.status(400).json(err);
            })
            .catch((err) => {
              diag.error(`Error deleting user after failed details save: ${err}`, {method: "POST", route: "/signup", status: 400});
              res.json({ error: err });
            });
          err;
        });
    })
    .catch((err) => {
      signupErrorRate.add(1);
      diag.error(`Error saving user: ${err}`, {method: "POST", route: "/signup", status: 400});
      res.status(400).json(err);
    });
});

router.post("/login", (req, res, next) => {
  loginCounter.add(1);
  diag.debug('Received login request', {method: "POST", route: "/login"});
  
  passport.authenticate(
    "local",
    { session: false },
    function (err, user, info) {
      if (err) {
        loginErrorRate.add(1);
        diag.error(`Error during authentication: ${err}`, {method: "POST", route: "/login", status: 400});
        return next(err);
      }
      if (!user) {
        loginErrorRate.add(1);
        diag.debug(`Authentication failed, user not found: ${JSON.stringify(info)}`, {method: "POST", route: "/login", status: 401});
        res.status(401).json(info);
        return;
      }
      diag.debug(`User authenticated successfully: ${JSON.stringify(user)}`, {method: "POST", route: "/login", status: 200});
      
      const token = jwt.sign({ _id: user._id }, authKeys.jwtSecretKey);
      diag.debug(`JWT token generated: ${token}`, {method: "POST", route: "/login", status: 200});
      
      res.json({
        token: token,
        type: user.type,
      });
    }
  )(req, res, next);
});

module.exports = router;
