const { trace, metrics } = require('@opentelemetry/api');
const passport = require("passport");

const tracer = trace.getTracer('jwtAuthTracer');
const meter = metrics.getMeter('jwtAuthMeter');

const authSuccessCounter = meter.createCounter('auth_success_count', {
  description: 'Count of successful authentications',
});

const authFailureCounter = meter.createCounter('auth_failure_count', {
  description: 'Count of failed authentications',
});

const authErrorCounter = meter.createCounter('auth_error_count', {
  description: 'Count of authentication errors',
});

const jwtAuth = (req, res, next) => {
  const span = tracer.startSpan('jwtAuth');
  passport.authenticate("jwt", { session: false }, function (err, user, info) {
    if (err) {
      span.addEvent('Error during authentication', { error: err });
      authErrorCounter.add(1);
      span.end();
      return next(err);
    }
    if (!user) {
      span.addEvent('Authentication failed', { info: info });
      authFailureCounter.add(1);
      res.status(401).json(info);
      span.end();
      return;
    }
    span.addEvent('Authentication successful', { user: user });
    authSuccessCounter.add(1);
    req.user = user;
    span.end();
    next();
  })(req, res, next);
};

module.exports = jwtAuth;
