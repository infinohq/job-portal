const { trace } = require("@opentelemetry/api");

const passport = require("passport");

const jwtAuth = (req, res, next) => {
  trace.log("User authentication started");
  passport.authenticate("jwt", { session: false }, function (err, user, info) {
    if (err) {
      trace.log("Error during authentication");
      return next(err);
    }
    if (!user) {
      trace.log("User not authenticated");
      res.status(401).json(info);
      return;
    }
    req.user = user;
    trace.log("User authenticated successfully");
    next();
  })(req, res, next);
};

module.exports = jwtAuth;