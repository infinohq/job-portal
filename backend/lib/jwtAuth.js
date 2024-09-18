const passport = require("passport");
const { diag } = require('@opentelemetry/api');

const jwtAuth = (req, res, next) => {
  passport.authenticate("jwt", { session: false }, function (err, user, info) {
    if (err) {
      diag.error('Authentication error:', err);
      return next(err);
    }
    if (!user) {
      diag.warn('Authentication failed, no user found:', info);
      res.status(401).json(info);
      return;
    }
    diag.info('User authenticated successfully:', user);
    req.user = user;
    next();
  })(req, res, next);
};

module.exports = jwtAuth;
