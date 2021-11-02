const bcrypt = require('bcrypt');
var captchapng = require('captchapng');

function LoginRouter(expressInstance) {

  var _this = this;
  var exceptions = null;

  expressInstance.get('/login', ["anonymous", "admin", "reader"], (req, res) => {

    // no login in session
    if (!req.session.loginInformation || req.session.loginInformation.user == "") {
      _this.goToLoginPage(req, res, {})
      return;
    }

    // valid login in session
    res.redirect('/');

  });

  expressInstance.get('/logout/action', ["admin", "reader"], (req, res) => {
    req.session.destroy(function(err) {
      if (err) {
        return logger.info(err);
      }
      res.redirect('/login');
    });
  });

  expressInstance.post('/login/action', ["anonymous"], (req, res) => {
    logger.info("Login validation for user:"+req.body.user);

    authenticationRepository.findOneByUserName(req.body.user.toLowerCase(), function(err, userInformation) {

      if (err || userInformation == null) {
        logger.info(err);
        req.session.error_message = "Incorrect user, password or captcha.";
        res.redirect("/login")
        return;
      }

      bcrypt.compare(req.body.password, userInformation.password, function(compareErr, compareResult) {

        if (compareErr) {
          logger.info("Failed at compare password with bcrypt");
          logger.info(compareErr);
          req.session.error_message = "Internal error.";
          res.redirect("/login");
          return;
        }

        if(!compareResult){
          logger.info("Password incorrect for user:" + req.body.user);
          req.session.error_message = "Incorrect user, password or captcha.";
          res.redirect("/login")
          return;
        }

        if (new Number(req.body.captcha) != req.session.captchaSecret) {
          logger.info("Captcha incorrect for user:" + req.body.user);
          req.session.error_message = "Incorrect user, password or captcha.";
          res.redirect("/login")
          return;
        }

        req.session.loginInformation = {
          "user": userInformation.username,
          "role": userInformation.role
        };
        req.session.save();
        res.redirect('/');
      });
    });
  });

  this.createCaptchaImageBase64 = function(secretCaptcha) {
    var p = new captchapng(100,30,secretCaptcha); // width,height,numeric captcha
    p.color(115, 95, 197, 100);  // First color: background (red, green, blue, alpha)
    p.color(30, 104, 21, 255); // Second color: paint (red, green, blue, alpha)
    var img = p.getBase64();
    var imgbase64 = new Buffer(img,'base64');
<<<<<<< HEAD
    //@TODO
    //(node:17659) [DEP0005] DeprecationWarning: Buffer() is deprecated due to security and usability issues. Please use the Buffer.alloc(), Buffer.allocUnsafe(), or Buffer.from() methods instead.
    return Buffer.from(imgbase64).toString('base64');
=======
    return Buffer.from(imgbase64).toString('base64');   ;
>>>>>>> 51c3f86b1e88f3e93ebc914cf1681af80153757d
  }

  this.goToLoginPage = function(req, res, redirectAttributes) {
    var captchaSecret = parseInt(Math.random()*90000000+10000000);
    var captchaImageBase64 = _this.createCaptchaImageBase64(captchaSecret);
    req.session.captchaSecret = captchaSecret;
    redirectAttributes.captcha = captchaImageBase64;
    redirectAttributes.success_message = req.session.success_message;
    redirectAttributes.warning_message = req.session.warning_message;
    redirectAttributes.error_message = req.session.error_message;
    res.render('login.hbs', redirectAttributes);
  }

}

module.exports = LoginRouter;
