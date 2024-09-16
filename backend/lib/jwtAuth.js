const { diag, DiagConsoleLogger, DiagLogLevel } = require('@opentelemetry/api');

// Set up a logger
diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.ALL);

const passport = require("passport");

const jwtAuth = (req, res, next) => {
  diag.info('Starting JWT authentication');
  passport.authenticate("jwt", { session: false }, function (err, user, info) {
    if (err) {
      diag.error('Error during JWT authentication', err);
      return next(err);
    }
    if (!user) {
      diag.warn('JWT authentication failed, no user found');
      res.status(401).json(info);
      return;
    }
    diag.info('JWT authentication successful');
    req.user = user;
    next();
  })(req, res, next);
};

module.exports = jwtAuth;