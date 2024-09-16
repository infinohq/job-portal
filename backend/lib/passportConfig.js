const { trace } = require("@opentelemetry/api");

trace.addEvent('User logs in');

passport.use(
  new Strategy(
    {
      usernameField: "email",
      passReqToCallback: true,
    },
    (req, email, password, done, res) => {
      trace.addEvent('Passport local strategy initiated');
      User.findOne({ email: email }, (err, user) => {
        if (err) {
          trace.addEvent('Error finding user in local strategy');
          return done(err);
        }
        if (!user) {
          trace.addEvent('User does not exist in local strategy');
          return done(null, false, {
            message: "User does not exist",
          });
        }

        user
          .login(password)
          .then(() => {
            trace.addEvent('User login successful in local strategy');
            user["_doc"] = filterJson(user["_doc"], ["password", "__v"]);
            return done(null, user);
          })
          .catch((err) => {
            trace.addEvent('Incorrect password in local strategy');
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
      trace.addEvent('Passport JWT strategy initiated');
      User.findById(jwt_payload._id)
        .then((user) => {
          trace.addEvent('User found in JWT strategy');
          if (!user) {
            return done(null, false, {
              message: "JWT Token does not exist",
            });
          }
          user["_doc"] = filterJson(user["_doc"], ["password", "__v"]);
          return done(null, user);
        })
        .catch((err) => {
          trace.addEvent('Incorrect token in JWT strategy');
          return done(err, false, {
            message: "Incorrect Token",
          });
        });
    }
  )
);

module.exports = passport;