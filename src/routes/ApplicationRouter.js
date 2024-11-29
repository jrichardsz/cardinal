const Utils = require('../common/Utils.js');
var escape = require('escape-html');

function ApplicationRouter(expressInstance) {

  expressInstance.get('/application/view/new', ["admin"], (req, res) => {
    res.render('application/new.hbs', {
      operation: "new"
    });
  });

  expressInstance.get('/search', ["admin"], async (req, res) => {
    logger.info("Search application:");
    let application = req.query.application;
    logger.info(application);

    let rows = await applicationRepository.findByNameAndDeleted(application, 'N');

    let renderAttributes = {
      redirect: './',
      applications: rows
    }

    if (rows.length === 0) {
      renderAttributes = {
        ...renderAttributes,
        ...{
          success_message: `No results were found for your application: ${application}`,
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

    homeRouter.goToHomePage(req, res, renderAttributes)
  })

  expressInstance.post('/application/action/save', ["admin"], (req, res) => {

    logger.info("Save application:");
    var applicationParameters = Utils.sanitizeObject(req.body)
    logger.info(applicationParameters);

    applicationRepository.save(applicationParameters, function (err, result) {
      if (err) {
        logger.error(`Error while trying to persist an application: ${err.code} ${err.sqlMessage}`);
        if (err.code === 'ER_DUP_ENTRY') {
          return res.render('application/new.hbs', {
            error_message: "An application already exist with provided name: " + applicationParameters.name
          });
        } else {
          logger.error(err);
          return res.render('application-variable/new_local_var.hbs', {
            error_message: "An error occurred when trying to save the application."
          });
        }
      } else {
        homeRouter.goToHomePage(req, res, {
          success_message: "The application was saved successfully."
        })
      }
    });
  });

  expressInstance.get('/application/view/edit/:id', ["admin"], (req, res) => {

    applicationRepository.findOneById(escape(req.params.id), function (err, application) {
      if (err) {
        logger.info(err);
        homeRouter.goToHomePage(req, res, {
          error_message: "An error occurred when trying to get the application."
        })
      } else {
        res.render('application/new.hbs', {
          application: application,
          operation: "edit"
        });
      }
    });
  });

  expressInstance.get('/application/view/delete/:id', ["admin"], (req, res) => {

    applicationRepository.findOneById(escape(req.params.id), function (err, application) {
      if (err) {
        logger.info(err);
        homeRouter.goToHomePage(req, res, {
          error_message: "An error occurred when trying to get the application."
        })
      } else {

        applicationVariableRepository.findVariablesByApplicationId(application.id, function (findApplicationsByVariableByIdErr, variables) {

          if (variables.length > 0) {
            var variablesAsString = Utils.arrayToSimpleRepresentation(variables, "name", ",");
            res.render('common/delete.hbs', {
              entityId: application.id,
              warningMessage: `You can not delete this application ${application.name} because has registered these variables: ${variablesAsString}. Delete them and try again.`,
              entityType: "application",
              "mode": "cannot-delete"
            });
          } else {
            res.render('common/delete.hbs', {
              entityId: application.id,
              warningMessage: "Are you sure you want to delete this application: {0}".format(application.name),
              entityType: "application",
              "mode": "confirm"
            });
          }

        });

      }
    });
  });

  //@TODO: use delete instead post method
  expressInstance.post('/application/action/delete', ["admin"], (req, res) => {

    logger.info("Delete application:");
    applicationRepository.delete(escape(req.body.id), function (err, result) {
      if (err) {
        logger.info(err);
        res.render('common/delete.hbs', {
          error_message: "An error occurred when trying to delete the application."
        });
      } else {
        homeRouter.goToHomePage(req, res, {
          success_message: "The application was deleted successfully."
        })
      }
    });
  });

}

module.exports = ApplicationRouter;
