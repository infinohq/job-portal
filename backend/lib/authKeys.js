const { diag } = require('@opentelemetry/api');

diag.info('Exporting jwtSecretKey with value: jwt_secret');

module.exports = {
  jwtSecretKey: "jwt_secret",
};