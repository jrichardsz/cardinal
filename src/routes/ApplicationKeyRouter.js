const bcrypt = require('bcrypt');
const uuid = require('uuid');

function ApplicationKeyRouter(expressInstance) {
  var _this = this;
  var javascriptModule = 'application-key';

  expressInstance.get('/application-key', ["admin"], (req, res) => {
    _this.goToHomePage(req, res)
  })

  expressInstance.get('/application-key/action/reset', ["admin"], (req, res) => {
    _this.resetApikey(req, res)
  })

  expressInstance.get('/application-key/action/copy', ["admin"], (req, res) => {
    _this.goToHomePage(req, res, {
      javascriptModule,
      redirect: '/application-key',
      success_message: `The apikey has been copied successfully.`
    })
  })

  this.goToHomePage = function (req, res, redirectAttributes) {

    req.session.success_message = undefined;

    applicationApikeyRepository.findAll(function (err, entities) {

      if (err) {
        logger.info(err)
        var renderAttributes = {
          javascriptModule,
          error_message: "An error occurred when trying to list apikey.",
          error_security_message: req.session.error_security_message || undefined,
          userRole: req.session.loginInformation.role || undefined
        }
        req.session.error_security_message = undefined;

        res.render('application-key/home.hbs', renderAttributes);
        return;
      }

      //if no one has configured a valid api key, save the default
      if (entities.length === 0) {
        return res.render('application-key/home.hbs', {
          javascriptModule,
          error_message: "apikey is not initialized. Do it now!!!",
          userRole: req.session.loginInformation.role || undefined
        });
      } else {
        
        var renderAttributes = {
          javascriptModule,
          success_message: "apikey is well configured. Anyway you could reset if a long time has passed or or was compromised",
          userRole: req.session.loginInformation.role || undefined
        }

        req.session.error_security_message = undefined;

        Object.assign(renderAttributes, redirectAttributes);

        res.render('application-key/home.hbs', renderAttributes)
      }
    })
  }

  this.resetApikey = function (req, res) {

    applicationApikeyRepository.delete(function (err, result) {
      if (err) {
        logger.info(err)
        var renderAttributes = {
          javascriptModule,
          error_message: "An error occurred when trying to delete apikey.",
          error_security_message: req.session.error_security_message || undefined,
          userRole: req.session.loginInformation.role || undefined
        }
        req.session.error_security_message = undefined;

        res.render('application-key/home.hbs', renderAttributes);
        return;
      }

      // A Key value must be between 30 and 128 characters.
      let apikey = _this.generatePassword();

      bcrypt.hash(apikey, 10, function (err, hash) {
        let apikeyHash = {
          apikey: hash
        }

        applicationApikeyRepository.save(apikeyHash, function (err, result) {

          if (err) {
            logger.error(`Error trying to persist an apikey: ${err.code} ${err.sqlMessage}`)
            if (err.code === 'ER_DUP_ENTRY') {
              return res.render('application-key/home.hbs', {
                javascriptModule,
                error_message: "A apikey already exists: " + entities.key,
                userRole: req.session.loginInformation.role || undefined
              });
            } else {
              logger.error(err);
              return res.render('application-key/home.hbs', {
                javascriptModule,
                error_message: "An error occurred while trying to save the apikey.",
                userRole: req.session.loginInformation.role || undefined
              });
            }
          } else {
            _this.goToHomePage(req, res, {
              javascriptModule,
              redirect: '/application-key',
              apikey: apikey,
              success_message : undefined,
              warning_message: `apikey has been reset. Save it because you won't see it again`,
              userRole: req.session.loginInformation.role || undefined
            })
          }
        })
      })

    })
  }

  this.generatePassword = function (length) {

    const passLength = length || 128;

    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

    let generate = '';

    for (let i = 0; i < passLength; i++) {
      generate += characters.charAt(Math.floor(Math.random() * characters.length))
    }

    return generate
  }
}

module.exports = ApplicationKeyRouter