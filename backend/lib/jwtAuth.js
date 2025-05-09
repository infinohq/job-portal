const { trace } = require("@opentelemetry/api");

const passport = require("passport");

const jwtAuth = (req, res, next) => {
  trace.log("User is attempting JWT authentication");
  passport.authenticate("jwt", { session: false }, function (err, user, info) {
    if (err) {
      trace.log("Error occurred during JWT authentication");
      return next(err);
    }
    if (!user) {
      trace.log("User authentication failed - Unauthorized");
      res.status(401).json(info);
      return;
    }
    req.user = user;
    trace.log("User authenticated successfully with JWT");
    next();
  })(req, res, next);
};

module.exports = jwtAuth;