const Utils = require('../common/Utils.js');
var escape = require('escape-html');
var aes256 = require('aes256');

function GlobalVariableRouter(expressInstance) {

  var _this = this;
  var cryptKey = properties.security.cryptKey;

  expressInstance.get('/global-variable', ["admin", "reader"], (req, res) => {
    _this.goToHomePage(req, res);
  });

  this.goToHomePage = function (req, res, redirectAttributes) {

    variableRepository.findByScopeAndDeleted("G", "N", function (err, entities) {

      if (err) {
        logger.info(err);
        var renderAttributes = {
          error_message: "An error occurred when trying to list global variables.",
          error_security_message: req.session.error_security_message || undefined
        };
        req.session.error_security_message = undefined;

        res.render('global-variable/home.hbs', renderAttributes);
        return;
      }

      var renderAttributes = {
        globalVariables: entities,
        error_security_message: req.session.error_security_message || undefined,
        userRole: req.session.loginInformation.role || undefined
      };

      req.session.error_security_message = undefined;

      Object.assign(renderAttributes, redirectAttributes);
      res.render('global-variable/home.hbs', renderAttributes);
    });
  }

  expressInstance.get('/global-variable/action/search', ["admin", "reader"], async (req, res) => {

    logger.info("Search global variable:");
    let globalVar = req.query.var.trim();
    logger.info(globalVar);

    let rows = await variableRepository.findLikeByNameAndScopeAndDeleted(globalVar, 'G', 'N');

    let renderAttributes = {
      redirect: '../',
      globalVariables: rows,
      globalVar
    };

    if (rows.length === 0) {
      renderAttributes = {
        ...renderAttributes,
        ...{
          success_message: `No results were found for your variable: ${globalVar}`,
          error_security_message: req.session.error_security_message || undefined,
          userRole: req.session.loginInformation.role || undefined
        }
      }
    } else {
      renderAttributes = {
        ...renderAttributes,
        ...{
          error_security_message: req.session.error_security_message || undefined,
          userRole: req.session.loginInformation.role || undefined
        }
      }
    }

    _this.goToHomePage(req, res,
      renderAttributes
    )
  })

  expressInstance.get('/global-variable/view/new', ["admin"], (req, res) => {
    res.render('global-variable/new.hbs', { "mode": "add" });
  });

  expressInstance.post('/global-variable/action/:mode/save', ["admin"], async (req, res) => {

    logger.info("Save/edit global variable:");

    var variable = Utils.sanitizeObject(req.body);
    variable.scope = 'G';

    let objectToLog = { ...variable.body }; objectToLog.value = "****";
    logger.info(objectToLog);

    //safe value store
    if (variable.type === "S") {
      variable.value = aes256.encrypt(cryptKey, variable.value);
    }

    //if is a new variable (without id)
    if (typeof escape(req.body.id) !== 'undefined' && escape(req.params.mode) === "add") {
      //validate unique name
      var variablesWhoAlreadyExist = await variableRepository.findByNameAndScopeAndDeleted(variable.name, "G", "N");

      if (typeof variablesWhoAlreadyExist !== 'undefined' && variablesWhoAlreadyExist.length > 0) {
        return res.render('global-variable/new.hbs', {
          error_message: "A variable already exist as global with provided name: " + variable.name,
          mode: escape(req.params.mode)
        });
      }
    }

    variableRepository.save(variable, function (err, result) {
      if (err) {
        logger.error(`Error while trying to persist variable: ${err.code} ${err.sqlMessage}`);
        res.render('global-variable/new.hbs', {
          error_message: "An error occurred when trying to save the global variable.",
          mode: escape(req.params.mode)
        });
      } else {
        _this.goToHomePage(req, res, {
          redirect: '/global-variable',
          success_message: "The global variable was saved successfully."
        })
      }
    });
  });

  expressInstance.get('/global-variable/view/edit/:id', ["admin"], (req, res) => {

    variableRepository.findOneById(escape(req.params.id), function (err, variable) {
      if (err) {
        logger.info(err);
        _this.goToHomePage(req, res, {
          error_message: "An error occurred when trying to get the global variable."
        })
      } else {
        //decr variable value to allow edit
        if (variable.type === "S") {
          variable.value = aes256.decrypt(cryptKey, variable.value);
        }
        res.render('global-variable/new.hbs', {
          global: variable,
          "mode": "edit"
        });
      }
    });
  });

  expressInstance.get('/global-variable/view/read/:id', ["reader"], (req, res) => {

    variableRepository.findOneById(escape(req.params.id), function (err, entity) {
      if (err) {
        logger.info(err);
        _this.goToHomePage(req, res, {
          error_message: "An error occurred when trying to read the global variable."
        })
      } else {

        if (entity.type === 'S') {
          entity.value = "*****"
        }

        res.render('global-variable/read.hbs', {
          variable: entity
        });
      }
    });
  });

  expressInstance.get('/global-variable/view/delete/:id', ["admin"], (req, res) => {

    variableRepository.findOneById(escape(req.params.id), function (err, variable) {
      if (err) {
        logger.info(err);
        homeRouter.goToHomePage(req, res, {
          error_message: "An error occurred when trying to get the variable."
        })
      } else {

        applicationVariableRepository.findApplicationsByVariableById(variable.id, function (findApplicationsByVariableByIdErr, applications) {

          if (applications.length > 0) {
            var appsString = Utils.arrayToSimpleRepresentation(applications, "name", ",");
            res.render('common/delete.hbs', {
              entityId: variable.id,
              warningMessage: `You can not delete this variable ${variable.name} because it is required in these applications : ${appsString}.`,
              entityType: "global-variable",
              "mode": "cannot-delete"
            });
          } else {
            res.render('common/delete.hbs', {
              entityId: variable.id,
              warningMessage: "Are you sure you want to delete this variable: {0}".format(variable.name),
              entityType: "global-variable",
              "mode": "confirm"
            });
          }
        });
      }
    });
  });

  expressInstance.post('/global-variable/action/delete', ["admin"], (req, res) => {

    logger.info("Delete variable:");
    variableRepository.delete(escape(req.body.id), function (err, result) {
      if (err) {
        logger.info(err);
        res.render('common/delete.hbs', {
          error_message: "An error occurred when trying to delete this variable."
        });
      } else {
        _this.goToHomePage(req, res, {
          redirect: '/global-variable',
          success_message: "The variable was deleted successfully."
        })
      }
    });
  });


}

module.exports = GlobalVariableRouter;
