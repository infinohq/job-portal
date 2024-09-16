const passport = require("passport");
const logger = require("logger");

const jwtAuth = (req, res, next) => {
  logger.info("JWT authentication middleware started");
  passport.authenticate("jwt", { session: false }, function (err, user, info) {
    if (err) {
      logger.error("Error during JWT authentication:", err);
      return next(err);
    }
    if (!user) {
      logger.warn("User not authenticated. Sending 401 response.");
      res.status(401).json(info);
      return;
    }
    req.user = user;
    logger.info("User authenticated successfully. Proceeding to the next middleware.");
    next();
  })(req, res, next);
};

module.exports = jwtAuth;