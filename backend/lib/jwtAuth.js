const { diag, DiagConsoleLogger, DiagLogLevel } = require('@opentelemetry/api');

// Set up a logger
diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.ALL);

const passport = require("passport");

const jwtAuth = (req, res, next) => {
  diag.debug('Starting JWT authentication', { req: req });
  passport.authenticate("jwt", { session: false }, function (err, user, info) {
    if (err) {
      diag.error('Error during JWT authentication', { error: err });
      return next(err);
    }
    if (!user) {
      diag.warn('JWT authentication failed', { info: info });
      res.status(401).json(info);
      return;
    }
    diag.debug('JWT authentication succeeded', { user: user });
    req.user = user;
    next();
  })(req, res, next);
};

module.exports = jwtAuth;