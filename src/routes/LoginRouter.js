const bcrypt = require("bcrypt");
var captchapng = require("captchapng");
var escape = require("escape-html");

function LoginRouter(expressInstance) {
  var _this = this;
  var exceptions = null;

  expressInstance.get(
    "/login",
    ["anonymous", "admin", "reader"],
    (req, res) => {
      // no login in session
      if (
        !req.session.loginInformation ||
        req.session.loginInformation.user == ""
      ) {
        _this.goToLoginPage(req, res, {});
        return;
      }

      // valid login in session
      res.redirect("/");
    }
  );

  expressInstance.get("/logout/action", ["admin", "reader"], (req, res) => {
    req.session.destroy(function (err) {
      if (err) {
        return logger.info(err);
      }
      res.redirect("/login");
    });
  });

  expressInstance.post("/login/action", ["anonymous"], (req, res) => {
    logger.info("Login validation for user:" + req.body.user);

    var incomingUser = escape(req.body.user);
    var incomingPassword = escape(req.body.password);
    var incomingCaptcha = escape(req.body.captcha);

    authenticationRepository.findOneByUserName(
      incomingUser.toLowerCase(),
      function (err, userInformation) {
        if (err || userInformation == null) {
          logger.info(err);
          req.session.error_message = "Incorrect user, password or captcha.";
          res.redirect("/login");
          return;
        }

        bcrypt.compare(
          incomingPassword,
          userInformation.password,
          function (compareErr, compareResult) {
            if (compareErr) {
              logger.info("Failed at compare password with bcrypt");
              logger.info(compareErr);
              req.session.error_message = "Internal error.";
              res.redirect("/login");
              return;
            }

            if (!compareResult) {
              logger.info("Password incorrect for user:" + incomingUser);
              req.session.error_message =
                "Incorrect user, password or captcha.";
              res.redirect("/login");
              return;
            }

            if (
              typeof properties.security.disableCaptcha === "undefined" ||
              properties.security.disableCaptcha == null ||
              properties.security.disableCaptcha === false
            ) {
              logger.info("captcha is enabled");
              if (new Number(incomingCaptcha) != req.session.captchaSecret) {
                logger.info("Captcha incorrect for user:" + incomingUser);
                req.session.error_message =
                  "Incorrect user, password or captcha.";
                return res.redirect("/login");
              }
            }

            req.session.loginInformation = {
              user: userInformation.username,
              role: userInformation.role,
            };
            req.session.save();
            return res.redirect("/");
          }
        );
      }
    );
  });

  this.createCaptchaImageBase64 = function (secretCaptcha) {
    var p = new captchapng(100, 30, secretCaptcha); // width,height,numeric captcha
    p.color(115, 95, 197, 100); // First color: background (red, green, blue, alpha)
    p.color(30, 104, 21, 255); // Second color: paint (red, green, blue, alpha)
    var img = p.getBase64();
    var imgbase64 = Buffer.from(img, "base64").toString("base64");
    return imgbase64;
  };

  this.goToLoginPage = function (req, res, redirectAttributes) {
    redirectAttributes.success_message = req.session.success_message;
    redirectAttributes.warning_message = req.session.warning_message;
    redirectAttributes.error_message = req.session.error_message;
    if (
      typeof properties.security.disableCaptcha === "undefined" ||
      properties.security.disableCaptcha == null ||
      properties.security.disableCaptcha === false
    ) {
      var captchaSecret = parseInt(Math.random() * 90000000 + 10000000);
      var captchaImageBase64 = _this.createCaptchaImageBase64(captchaSecret);
      req.session.captchaSecret = captchaSecret;
      redirectAttributes.captcha = captchaImageBase64;
    }
    res.render("login.hbs", redirectAttributes);
  };
}

module.exports = LoginRouter;
