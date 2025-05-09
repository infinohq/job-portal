const { diag, DiagConsoleLogger, DiagLogLevel } = require('@opentelemetry/api');

// Set up a logger
diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.ALL);

const passport = require("passport");
const Strategy = require("passport-local").Strategy;

const passportJWT = require("passport-jwt");
const JWTStrategy = passportJWT.Strategy;
const ExtractJWT = passportJWT.ExtractJwt;

const User = require("../db/User");
const authKeys = require("./authKeys");

const filterJson = (obj, unwantedKeys) => {
  const filteredObj = {};
  Object.keys(obj).forEach((key) => {
    if (unwantedKeys.indexOf(key) === -1) {
      filteredObj[key] = obj[key];
    }
  });
  diag.debug('Filtered JSON object', { filteredObj });
  return filteredObj;
};

passport.use(
  new Strategy(
    {
      usernameField: "email",
      passReqToCallback: true,
    },
    (req, email, password, done, res) => {
      diag.debug('Authenticating user', { email, password });
      User.findOne({ email: email }, (err, user) => {
        if (err) {
          diag.error('Error finding user', { err });
          return done(err);
        }
        if (!user) {
          diag.warn('User does not exist', { email });
          return done(null, false, {
            message: "User does not exist",
          });
        }

        user
          .login(password)
          .then(() => {
            diag.debug('User logged in successfully', { email });
            user["_doc"] = filterJson(user["_doc"], ["password", "__v"]);
            return done(null, user);
          })
          .catch((err) => {
            diag.error('Password is incorrect', { err });
            return done(err, false, {
              message: "Password is incorrect.",
            });
          });
      });
    }
  )
);

passport.use(
  new JWTStrategy(
    {
      jwtFromRequest: ExtractJWT.fromAuthHeaderAsBearerToken(),
      secretOrKey: authKeys.jwtSecretKey,
    },
    (jwt_payload, done) => {
      diag.debug('Authenticating JWT', { jwt_payload });
      User.findById(jwt_payload._id)
        .then((user) => {
          diag.debug('User found by JWT', { user });
          console.log(Object.keys(jwt_payload));
          if (!user) {
            diag.warn('JWT Token does not exist', { jwt_payload });
            return done(null, false, {
              message: "JWT Token does not exist",
            });
          }
          user["_doc"] = filterJson(user["_doc"], ["password", "__v"]);
          return done(null, user);
        })
        .catch((err) => {
          diag.error('Incorrect Token', { err });
          return done(err, false, {
            message: "Incorrect Token",
          });
        });
    }
  )
);

module.exports = passport;