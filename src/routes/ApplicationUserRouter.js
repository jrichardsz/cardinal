const Utils = require("../common/Utils");
const bcrypt = require('bcrypt');

function ApplicationUserRouter(expressInstance) {
  var _this = this;

  expressInstance.get('/application-user', ["admin"], (req, res) => {
    _this.goToHomePage(req, res)
  })

  expressInstance.get('/application-user/view/new', ["admin"], (req, res) => {
    res.render('application-user/operations-user.hbs', {
      operation: "New"
    })
  })

  expressInstance.get('/application-user/view/edit/:id', ["admin"], (req, res) => {

    applicationUserRepository.findOneById(req.params.id, function (err, user) {
      if (err) {
        logger.info(err)
        this.goToHomePage(req, res, {
          error_message: "An error occurred while trying to get the user."
        })
      } else {
        res.render('application-user/operations-user.hbs', {
          user: user,
          operation: 'Edit'
        })
      }
    })
  })

  expressInstance.get('/application-user/view/delete/:id', ["admin"], (req, res) => {
    applicationUserRepository.findOneById(req.params.id, function (err, user) {
      if (err) {
        logger.info(err)
        _this.goToHomePage(req, res, {
          error_message: "An error occurred while trying to get the user."
        })
      } else {
        res.render('common/delete.hbs', {
          entityId: user.id,
          warningMessage: "Are you sure you want to delete this user: {0}".format(user.username),
          entityType: "application-user",
          mode: "confirm"
        })
      }
    })
  })

  this.goToHomePage = function (req, res, redirectAttributes) {
    applicationUserRepository.findAll(function (err, entities) {
      if (err) {
        logger.info(err);
        var renderAttributes = {
          error_message: "An error occurred when trying to list user.",
          error_security_message: req.session.error_security_message || undefined
        };
        req.session.error_security_message = undefined;

        res.render('application-user/home.hbs', renderAttributes);
        return;
      }

      var renderAttributes = {
        applicationUser: entities,
        error_security_message: req.session.error_security_message || undefined,
        userRole: req.session.loginInformation.role || undefined
      }

      req.session.error_security_message = undefined;

      Object.assign(renderAttributes, redirectAttributes);
      res.render('application-user/home.hbs', renderAttributes);
    })
  }

  expressInstance.post('/application-user/action/save', ["admin"], async (req, res) => {

    logger.info("Save user: ");
    var userParameters = Utils.sanitizeObject(req.body);
    logger.info(userParameters.username);

    var saltRoundsGenerationNumber = 10;
    bcrypt.hash(userParameters.password, saltRoundsGenerationNumber, function (err, hash) {
      if (err) {
        logger.error(err)
        return;
      }

      var entity = {
        ...userParameters,
        ...{ password: hash }
      }

      applicationUserRepository.save(entity, function (err, result) {
        if (err) {
          logger.error(`Error trying to persist a user: ${err.code} ${err.sqlMessage}`)
          if (err.code === 'ER_DUP_ENTRY') {
            return res.render('application-user/home.hbs', {
              error_message: "A user already exists: " + entity.username
            });
          } else {
            logger.error(err);
            return res.render('application-user/new_user.hbs', {
              error_message: "An error occurred while trying to save the user."
            });
          }
        } else {
          let success_message =
            entity.id
              ? `The user was update successfully: ${entity.username}`
              : `The user was saved successfully: ${entity.username}`;
              
          _this.goToHomePage(req, res, {
            redirect: '/application-user',
            success_message
          })
        }

        if (err) {
          logger.error(err);
          logger.error(userName + " user cannot be created.");
          return;
        }
      })
    })
  })

  expressInstance.post('/application-user/action/delete', ["admin"], (req, res) => {
    logger.info("Delete user: ")
    applicationUserRepository.delete(req.body.id, function (err, result) {
      if (err) {
        logger.info(err)
        res.render('common/delete.hbs', {
          error_message: "An error occurred while trying to delete the user."
        })
      } else {
        _this.goToHomePage(req, res, {
          success_message: "The user was deleted successfully."
        })
      }
    })
  })

}

module.exports = ApplicationUserRouter;