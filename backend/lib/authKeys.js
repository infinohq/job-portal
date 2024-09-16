const { diag, DiagConsoleLogger, DiagLogLevel } = require('@opentelemetry/api');

// Set up OpenTelemetry diagnostics
diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.ALL);

diag.info('Initializing module exports with JWT secret key.');

module.exports = {
  jwtSecretKey: "jwt_secret",
};

diag.info('Module exports initialized successfully.');