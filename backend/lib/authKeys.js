const { trace } = require("@opentelemetry/api");

module.exports = {
  jwtSecretKey: "jwt_secret",
};

trace.log("User logged in");