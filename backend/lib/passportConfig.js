const passport = require("passport");
const { diag } = require("@opentelemetry/api");
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
  diag.debug("Filtered object: ", filteredObj);
  return filteredObj;
};

passport.use(
  new Strategy(
    {
      usernameField: "email",
      passReqToCallback: true,
    },
    (req, email, password, done, res) => {
      diag.debug("Authenticating user with email: ", email);
      User.findOne({ email: email }, (err, user) => {
        if (err) {
          diag.error("Error finding user: ", err);
          return done(err);
        }
        if (!user) {
          diag.warn("User not found for email: ", email);
          return done(null, false, {
            message: "User does not exist",
          });
        }

        user
          .login(password)
          .then(() => {
            diag.debug("User logged in successfully: ", user._id);
            user["_doc"] = filterJson(user["_doc"], ["password", "__v"]);
            return done(null, user);
          })
          .catch((err) => {
            diag.error("Login failed for user: ", user._id, " Error: ", err);
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
      diag.debug("Authenticating JWT payload: ", jwt_payload);
      User.findById(jwt_payload._id)
        .then((user) => {
          diag.debug("User found for JWT payload: ", jwt_payload._id);
          if (!user) {
            diag.warn("User not found for JWT payload: ", jwt_payload._id);
            return done(null, false, {
              message: "JWT Token does not exist",
            });
          }
          user["_doc"] = filterJson(user["_doc"], ["password", "__v"]);
          return done(null, user);
        })
        .catch((err) => {
          diag.error("Error processing JWT payload: ", jwt_payload, " Error: ", err);
          return done(err, false, {
            message: "Incorrect Token",
          });
        });
    }
  )
);

module.exports = passport;
