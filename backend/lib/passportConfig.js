const { diag, DiagConsoleLogger, DiagLogLevel } = require('@opentelemetry/api');

// Set up OpenTelemetry diagnostics
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
  return filteredObj;
};

passport.use(
  new Strategy(
    {
      usernameField: "email",
      passReqToCallback: true,
    },
    (req, email, password, done, res) => {
      diag.debug(`Authenticating user with email: ${email}`);
      User.findOne({ email: email }, (err, user) => {
        if (err) {
          diag.error(`Error finding user with email: ${email}`, err);
          return done(err);
        }
        if (!user) {
          diag.warn(`User with email: ${email} does not exist`);
          return done(null, false, {
            message: "User does not exist",
          });
        }

        user
          .login(password)
          .then(() => {
            diag.debug(`User with email: ${email} authenticated successfully`);
            user["_doc"] = filterJson(user["_doc"], ["password", "__v"]);
            return done(null, user);
          })
          .catch((err) => {
            diag.error(`Password incorrect for user with email: ${email}`, err);
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
      diag.debug(`Authenticating user with JWT payload: ${JSON.stringify(jwt_payload)}`);
      User.findById(jwt_payload._id)
        .then((user) => {
          diag.debug(`User found with ID: ${jwt_payload._id}`);
          if (!user) {
            diag.warn(`User with ID: ${jwt_payload._id} does not exist`);
            return done(null, false, {
              message: "JWT Token does not exist",
            });
          }
          user["_doc"] = filterJson(user["_doc"], ["password", "__v"]);
          return done(null, user);
        })
        .catch((err) => {
          diag.error(`Error authenticating user with JWT payload: ${JSON.stringify(jwt_payload)}`, err);
          return done(err, false, {
            message: "Incorrect Token",
          });
        });
    }
  )
);

module.exports = passport;