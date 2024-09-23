const passport = require("passport");
const { diag } = require('@opentelemetry/api');

const jwtAuth = (req, res, next) => {
  passport.authenticate("jwt", { session: false }, function (err, user, info) {
    if (err) {
      diag.error(`Authentication error: ${err}`, {method: "GET", route: "/jobs/id", status: 400});
      return next(err);
    }
    if (!user) {
      diag.debug(`No user found, authentication info: ${info}`, {method: "GET", route: "/jobs/id", status: 401});
      res.status(401).json(info);
      return;
    }
    diag.info(`User authenticated successfully: ${user}`, {method: "GET", route: "/jobs/id", status: 200});
    req.user = user;
    next();
  })(req, res, next);
};

module.exports = jwtAuth;
