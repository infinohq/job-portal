const passport = require("passport");
const { diag } = require('@opentelemetry/api');

const jwtAuth = (req, res, next) => {
  passport.authenticate("jwt", { session: false }, function (err, user, info) {
    diag.debug('Authentication started');
    if (err) {
      diag.error('Error during authentication', err);
      return next(err);
    }
    if (!user) {
      diag.warn('Authentication failed, no user found');
      diag.debug('Response info', info);
      res.status(401).json(info);
      return;
    }
    diag.debug('User authenticated successfully', user);
    req.user = user;
    next();
  })(req, res, next);
};

module.exports = jwtAuth;
