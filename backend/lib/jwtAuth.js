```javascript
const passport = require("passport");

const jwtAuth = (req, res, next) => {
  console.log("Authenticating user with JWT");
  passport.authenticate("jwt", { session: false }, function (err, user, info) {
    if (err) {
      console.error("Error during JWT authentication:", err);
      return next(err);
    }
    if (!user) {
      console.log("User not authenticated with JWT:", info);
      res.status(401).json(info);
      return;
    }
    req.user = user;
    console.log("User authenticated with JWT");
    next();
  })(req, res, next);
};

module.exports = jwtAuth;
```