const { trace } = require('@opentelemetry/api');
const passport = require("passport");

const tracer = trace.getTracer('jwtAuthTracer');

const jwtAuth = (req, res, next) => {
  const span = tracer.startSpan('jwtAuth');
  passport.authenticate("jwt", { session: false }, function (err, user, info) {
    if (err) {
      span.addEvent('Error during authentication', { error: err });
      span.end();
      return next(err);
    }
    if (!user) {
      span.addEvent('Authentication failed', { info: info });
      res.status(401).json(info);
      span.end();
      return;
    }
    span.addEvent('Authentication successful', { user: user });
    req.user = user;
    span.end();
    next();
  })(req, res, next);
};

module.exports = jwtAuth;