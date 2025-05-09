const { trace } = require("@opentelemetry/api");
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
      const span = trace.getTracer("default").startSpan("local-strategy-auth");
      span.setAttribute("email", email);
      User.findOne({ email: email }, (err, user) => {
        if (err) {
          span.setAttribute("error", true);
          span.end();
          return done(err);
        }
        if (!user) {
          span.setAttribute("user_found", false);
          span.end();
          return done(null, false, {
            message: "User does not exist",
          });
        }

        user
          .login(password)
          .then(() => {
            user["_doc"] = filterJson(user["_doc"], ["password", "__v"]);
            span.setAttribute("user_authenticated", true);
            span.end();
            return done(null, user);
          })
          .catch((err) => {
            span.setAttribute("error", true);
            span.end();
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
      const span = trace.getTracer("default").startSpan("jwt-strategy-auth");
      span.setAttribute("jwt_payload_id", jwt_payload._id);
      User.findById(jwt_payload._id)
        .then((user) => {
          span.setAttribute("jwt_payload_keys", Object.keys(jwt_payload));
          if (!user) {
            span.setAttribute("user_found", false);
            span.end();
            return done(null, false, {
              message: "JWT Token does not exist",
            });
          }
          user["_doc"] = filterJson(user["_doc"], ["password", "__v"]);
          span.setAttribute("user_authenticated", true);
          span.end();
          return done(null, user);
        })
        .catch((err) => {
          span.setAttribute("error", true);
          span.end();
          return done(err, false, {
            message: "Incorrect Token",
          });
        });
    }
  )
);

module.exports = passport;
