const { diag, DiagConsoleLogger, DiagLogLevel } = require('@opentelemetry/api');

// Set up a logger
diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.ALL);

diag.info('Exporting jwtSecretKey with value:', { jwtSecretKey: "jwt_secret" });

module.exports = {
  jwtSecretKey: "jwt_secret",
};