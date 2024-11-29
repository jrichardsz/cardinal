var aes256 = require('aes256');
const fs = require('fs');
const Utils = require('../common/Utils.js');
const ApplicationVariableService = require(appHomePath + '/service/ApplicationVariableService.js');
const applicationVariableService = new ApplicationVariableService();
const util = require('util');
const readFile = util.promisify(fs.readFile);
const escape = require('escape-html');

function ApplicationVariableRouter(expressInstance) {

  var cryptKey = properties.security.cryptKey;
  var defaultCryptedValueForImport = aes256.encrypt(cryptKey, "changeme");
  var _this = this;

  expressInstance.get('/application-variable', ["admin", "reader"], (req, res) => {
    _this.goToHomePage(req, res);
  });

  this.goToHomePage = function (req, res, redirectAttributes) {

    applicationRepository.findByDeleted("N", function (err, entities) {

      if (err) {
        logger.info(err);
        let renderAttributes = {
          error_message: "An error occurred when trying to list applications.",
          error_security_message: req.session.error_security_message || undefined
        };
        req.session.error_security_message = undefined;
        res.render('application-variable/home.hbs', renderAttributes);
        return;
      }

      var renderAttributes = {
        applications: entities,
        javascriptModule: 'application-variable'
      };

      var applicationId;
      if (req.query.application_id && req.query.application_id != "-1") {
        applicationId = escape(req.query.application_id);
      } else if (typeof redirectAttributes !== 'undefined' && typeof redirectAttributes.application_id !== 'undefined' && redirectAttributes.application_id != "-1") {
        applicationId = redirectAttributes.application_id;
      }

      logger.info("Selected application:" + applicationId)
      if (applicationId && applicationId != "-1") {
        renderAttributes.selectedApplicationId = applicationId;
        Object.assign(renderAttributes, redirectAttributes);
        if (!renderAttributes.hasOwnProperty('variables')) {
          applicationVariableRepository.findVariablesByApplicationId(applicationId, function (errVarApplications, entities) {

            if (errVarApplications) {
              logger.info(errVarApplications);
              req.query.applicationId = null;

              let renderAttributes = {
                error_message: "An error occurred when trying to list variables of selected application.",
                error_security_message: req.session.error_security_message || undefined
              };
              req.session.error_security_message = undefined;

              _this.goToHomePage(req, res, renderAttributes)
              return;
            }

            renderAttributes.variables = entities;
            renderAttributes.error_security_message = req.session.error_security_message || undefined
            renderAttributes.userRole = req.session.loginInformation.role || undefined
            res.render('application-variable/home.hbs', renderAttributes);
          });
        } else {
          res.render('application-variable/home.hbs', renderAttributes);
        }
      } else {
        renderAttributes.redirect = '/application-variable';
        Object.assign(renderAttributes, redirectAttributes);
        res.render('application-variable/home.hbs', renderAttributes);
      }
    });
  }

  expressInstance.get('/application-variable/view/:selectedApplicationId/:scope/new', ["admin"], (req, res) => {

    var scope = escape(req.params.scope);
    var applicationId = escape(req.params.selectedApplicationId);

    //validate id application exist
    applicationRepository.findOneById(applicationId, function (err, application) {
      if (err) {
        logger.info(err);
        let renderAttributes = {
          error_message: "An error occurred when trying to get the application.",
          error_security_message: req.session.error_security_message || undefined
        };
        req.session.error_security_message = undefined;
        res.render('application-variable/home.hbs', renderAttributes);
        return;
      }

      //if application exist, show variables options
      if (scope == "local") {
        return res.render('application-variable/new_local_var.hbs', {
          application_id: applicationId,
          application_name: application.name,
          mode: "add"
        });
      } else if (scope == "global") {

        applicationVariableRepository.findVariablesByApplicationId(applicationId, function (selectApplicationVariablesErr, applicationVariables) {
          if (selectApplicationVariablesErr) {
            logger.error(selectApplicationVariablesErr);
            _this.goToHomePage(req, res, {
              redirect: '/application-variable',
              error_message: "Variables cannot be obtained for selected application."
            })
          } else {
            variableRepository.findByScopeAndDeleted("G", "N", function (selectGlobalVariablesErr, globalVariables) {
              if (selectGlobalVariablesErr) {
                logger.error(selectGlobalVariablesErr);
                _this.goToHomePage(req, res, {
                  redirect: '/application-variable',
                  error_message: "Global variables cannot be obtained."
                })
              } else {

                var availableGlobalVariables = [];

                for (var globalVariablesIndex in globalVariables) {
                  logger.debug("search " + globalVariables[globalVariablesIndex].id + " in");
                  if (!Utils.arrayContainsObject(globalVariables[globalVariablesIndex].id, "variable_id", applicationVariables)) {
                    availableGlobalVariables.push(globalVariables[globalVariablesIndex]);
                  }
                }

                res.render('application-variable/add_global_var.hbs', {
                  application_id: escape(req.params.selectedApplicationId),
                  variables: availableGlobalVariables,
                  application_name: application.name
                });
              }
            });
          }
        });
      }

    })

  });

  expressInstance.get('/application-variable/action/:selectedApplicationId/variables/export', ["admin", "reader"], (req, res) => {

    var applicationId = escape(req.params.selectedApplicationId);
    applicationRepository.findOneById(applicationId, function (err, application) {
      if (err) {
        logger.info(err);
        res.type('text/html');
        res.send("An error occurred while trying to find the selected application");
      }

      applicationVariableRepository.findVariablesByApplicationId(applicationId, function (selectApplicationVariablesErr, applicationVariables) {

        var variables = [];
        applicationVariables.forEach(function (variable) {
          variables.push({
            "name": variable.name,
            "value": variable.type === "S" ? "*****" : variable.value,
            "description": variable.description,
            "type": variable.type,
            "scope": variable.scope,
          });
        });

        res.set({
          "Content-Disposition": `attachment; filename=\"${application.name}.json\"`
        });
        res.send(JSON.stringify(variables, null, 4));
      });

    });

  });

  expressInstance.get('/application-variable/action/:id/search', ["admin", "reader"], async (req, res) => {
    let applicationId = req.params.id;
    let variable = req.query.variable;

    let rows = await applicationVariableRepository.findVariableInApplicationById(applicationId, variable);

    let renderAttributes = {
      application_id: applicationId,
      variables: rows
    }

    if (rows.length === 0) {
      renderAttributes = {
        ...renderAttributes,
        ...{
          success_message: `No results were found for your variable: ${variable}`,
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

    _this.goToHomePage(req, res, renderAttributes)
  })

  expressInstance.post('/application-variable/action/:selectedApplicationId/variables/import', ["admin", "reader"], async (req, res) => {

    var applicationId = escape(req.params.selectedApplicationId);
    var resultMessages = [];

    if (!req.files || Object.keys(req.files).length === 0) {
      return _this.goToHomePage(req, res, {
        redirect: '/application-variable',
        error_message: 'No files were uploaded.',
        application_id: applicationId
      })
    }

    // Accessing the file by the <input> File name="import_file"
    let targetFile = req.files.import_file;
    if (targetFile.mimetype !== 'application/json') {
      return _this.goToHomePage(req, res, {
        redirect: '/application-variable',
        error_message: "File type is not allowed: " + targetFile.mimetype + ". Just json files are allowed.",
        application_id: applicationId
      })
    }

    var rawVariablesToImportStrin;
    try {
      rawVariablesToImportString = await readFile(targetFile.tempFilePath, "utf8");
    } catch (err) {
      logger.error(err);
      return _this.goToHomePage(req, res, {
        redirect: '/application-variable',
        error_message: "Failed to read the file",
        application_id: applicationId
      })
    }


    var incomingVariablesToImport;
    try {
      incomingVariablesToImport = JSON.parse(rawVariablesToImportString);
    } catch (err) {
      logger.error(err);
      return _this.goToHomePage(req, res, {
        redirect: '/application-variable',
        error_message: "Not valid json.",
        application_id: applicationId
      })
    }

    if (!Array.isArray(incomingVariablesToImport) || incomingVariablesToImport.length == 0) {
      logger.error("json to import is empty");
      return _this.goToHomePage(req, res, {
        redirect: '/application-variable',
        warning_message: "json is empty or is not a collection of variables",
        application_id: applicationId
      })
    }

    //TODO: validate the consistence of item on json

    var safeReceivedVariables = Utils.obfuscateFieldInArrayOfObjects(incomingVariablesToImport, "value", "****", 10);
    logger.info("received variables to import")
    logger.info(safeReceivedVariables);

    //get sub sets of the received variables
    //these subsets are variables that not exist
    var newGlobalsToBeCreated = await applicationVariableService.getNewVariablesReadyToInsertByScope(incomingVariablesToImport, "G");
    logger.info("new globals to insert");
    logger.info(Utils.arrayObjecsToArrayValues(newGlobalsToBeCreated, "name"));

    //globals
    //if newGlobalsToBeCreated length == 0, it means that exist as variables
    //just we need to determine if were added to this application

    //if newGlobalsToBeCreated length > 0, user wants to import some globals
    //these global variables does not exist in table: variable
    //if it does not exist in its table, it does not exist in application_variable
    logger.info("Importing globals");
    if (newGlobalsToBeCreated.length == 0) {
      logger.info("All the received globals already exist");
      //get the global names of received
      var receivedGlobalNames = Utils.arrayObjecsToArrayValuesFilterByField(incomingVariablesToImport, "name", "scope", "G");
      if (receivedGlobalNames.length > 0) {
        logger.info("global already existent:" + receivedGlobalNames);
        resultMessages.push({ level: "warning", message: "Globals already exist: " + receivedGlobalNames })
        //search if globals were added to this application
        var alreadyGlobalsInApplication = await applicationVariableRepository.
          findAlreadyExistentVariablesInApplicationByNamesAndScope(applicationId, receivedGlobalNames, "G");
        //if 3 were received and 3 already exist in this application
        if (alreadyGlobalsInApplication.length == receivedGlobalNames.length) {
          resultMessages.push({
            level: "warning", message: "Globals have been already added to this application: " +
              Utils.arrayObjecsToArrayValues(alreadyGlobalsInApplication, "name")
          })
          logger.info("All the received globals have already been added to this application");
        } else {
          //there are some globals which exist but are not yet in this application
          logger.info("there are some globals which exist but are not yet in this application");
          var alreadyGlobalNamesInApplication = Utils.arrayObjecsToArrayValues(alreadyGlobalsInApplication, "name");
          var globalNotAddedToApp =
            Utils.getDifferenceBetweenArrays(receivedGlobalNames, alreadyGlobalNamesInApplication);
          logger.info("globalNotAddedToApp")
          logger.info(globalNotAddedToApp)
          var receivedGlobalVariablesFullData = await variableRepository.findVariablesByNamesAndScope(globalNotAddedToApp, "G");
          var applicationVariables = [];
          receivedGlobalVariablesFullData.forEach((variable, i) => {
            applicationVariables.push([applicationId, variable.id]);
          });
          logger.info("adding these globals to this application");
          logger.info(applicationVariables);
          await applicationVariableRepository.bulkInsert("application_id, variable_id", applicationVariables);
          resultMessages.push({ level: "success", message: "Globals were added to this application successfully" })
        }
      } else {
        logger.info("this app don't have globals");
      }
    } else {
      try {
        logger.info("Some globals already exist and other needs to be created");
        //step 1 : insert the new global variables
        var safeGlobalsToInsert = Utils.overrideFieldWithConditionInArrayOfObjects(newGlobalsToBeCreated, "value", defaultCryptedValueForImport, "type", "S");
        logger.info("new globals to create");
        logger.info(safeGlobalsToInsert);
        await variableRepository.bulkInsert("name, value, description, type, scope", safeGlobalsToInsert);
        resultMessages.push({ level: "success", message: "Globals were created successfully" })
        logger.info("Globals were created successfully");
        //due to mysql behavior, after bulk insert, we don't have its primary keys.
        //we need to query them
        //at this point the new created globals and the pre-existent global are ready to be added to the application
        //prepare the new globals to be added to the app
        var globalNamesRecentlyCreated = Utils.arrayObjecsToArrayValuesFilterByField(newGlobalsToBeCreated, "name", "scope", "G");
        var recentlyCreatedVariablesFullData = await variableRepository.findVariablesByNamesAndScope(globalNamesRecentlyCreated, "G");
        //step 2: retrieve the ids of created variables
        // create an array with the new variable ids
        var applicationVariables = [];
        recentlyCreatedVariablesFullData.forEach((variableId, i) => {
          applicationVariables.push([applicationId, variableId.id]);
        });

        logger.info("recently created to be added:" + JSON.stringify(applicationVariables));

        //append the pre-existent but not added yet
        //get all global names from import file
        var allGlobalNamesToImport = Utils.arrayObjecsToArrayValuesFilterByField(incomingVariablesToImport, "name", "scope", "G");
        logger.info("allGlobalNamesToImport:" + JSON.stringify(allGlobalNamesToImport));
        var alreadyGlobalsInApplication = await applicationVariableRepository.
          findAlreadyExistentVariablesInApplicationByNamesAndScope(applicationId, allGlobalNamesToImport, "G");
        var alreadyGlobalNamesInApplication = Utils.arrayObjecsToArrayValues(alreadyGlobalsInApplication, "name");
        //get the difference between the all globals - recently created = already created
        var globalAlreadyCreatedButNotAddedBeforeImport = Utils.getDifferenceBetweenArrays(allGlobalNamesToImport, alreadyGlobalNamesInApplication);
        var globalAlreadyCreatedToBeAddedToApp = Utils.getDifferenceBetweenArrays(globalAlreadyCreatedButNotAddedBeforeImport, globalNamesRecentlyCreated);
        logger.info("globalAlreadyCreatedToBeAddedToApp");
        logger.info(globalAlreadyCreatedToBeAddedToApp);

        if (globalAlreadyCreatedToBeAddedToApp.length > 0) {//
          var alreadyCreatedToBeAddedVariablesFullData = await variableRepository.findVariablesByNamesAndScope(globalAlreadyCreatedToBeAddedToApp, "G");
          alreadyCreatedToBeAddedVariablesFullData.forEach((variableId, i) => {
            applicationVariables.push([applicationId, variableId.id]);
          });
        }

        logger.info("recently created + (already created but not added):" + JSON.stringify(applicationVariables));

        //step 3: add the global variables to the application
        await applicationVariableRepository.bulkInsert("application_id, variable_id", applicationVariables);
        resultMessages.push({ level: "success", message: "Globals were added to this application successfully" })
        logger.info("Globals were added to this application successfully");
      } catch (err) {
        logger.error(err)
        return _this.goToHomePage(req, res, {
          redirect: '/application-variable',
          error_message: err,
          application_id: applicationId
        })
      }
    }

    logger.info("Importing locals");
    //locals

    //compare incoming locals with existent locas
    var incomingLocalVariableNames = Utils.arrayObjecsToArrayValuesWithFilter(incomingVariablesToImport, "name", "scope", "L");
    logger.info("incomingLocalVariableNames")
    logger.info(incomingLocalVariableNames)

    if (typeof incomingLocalVariableNames === 'undefined' || incomingLocalVariableNames.length == 0) {
      logger.info("Import file don't have local variables");
      return _this.goToHomePage(req, res, {
        redirect: '/application-variable',
        multiple_messages: resultMessages,
        application_id: applicationId
      })
    }

    var localVariablesAlreadyAddedToThisApplication = await applicationVariableRepository.
      findAlreadyExistentVariablesInApplicationByNamesAndScope(applicationId, incomingLocalVariableNames, "L");

    logger.info("localVariablesAlreadyAddedToThisApplication")
    logger.info(Utils.arrayObjecsToArrayValues(localVariablesAlreadyAddedToThisApplication, "name"))
    logger.info("incomingLocalVariableNames")
    logger.info(incomingLocalVariableNames)

    //non added local to this application
    var localsDontAddedToThisApplication =
      Utils.getDifferenceBetweenArrays(incomingLocalVariableNames,
        Utils.arrayObjecsToArrayValues(localVariablesAlreadyAddedToThisApplication, "name"));
    logger.info("localsDontAddedToThisApplication")
    logger.info(localsDontAddedToThisApplication)

    //if incoming locals length is equal to already existent local variables in this application
    if (localVariablesAlreadyAddedToThisApplication.length == incomingLocalVariableNames.length) {
      resultMessages.push({
        level: "warning", message: "Locals already exist in this application: " +
          Utils.arrayObjecsToArrayValuesFilterByField(incomingVariablesToImport, "name", "scope", "L").join("\n")
      })
      //TODO: show in which application this variables already exist
      logger.info("All local variables already exist in this application");
    } if (localsDontAddedToThisApplication.length > 0) {
      try {

        //get variable to insert
        var applicationVariables = [];
        for (var incomingVariable of incomingVariablesToImport) {
          var variableToInsert = { ...incomingVariable };
          if (variableToInsert.scope == 'L' && localsDontAddedToThisApplication.includes(variableToInsert.name)) {
            if (variableToInsert.type == 'S') {
              variableToInsert.value = defaultCryptedValueForImport;
            }
            var createdVariable = await variableRepository.saveWithPromise(variableToInsert)
            applicationVariables.push([applicationId, createdVariable.insertId]);
          }
        }
        logger.info("Locals were created successfully");
        logger.info("applicationVariables");
        logger.info(applicationVariables);

        //add the local variables to the application
        await applicationVariableRepository.bulkInsert("application_id, variable_id", applicationVariables);
        resultMessages.push({ level: "success", message: "Locals were added to this application successfully: " + localsDontAddedToThisApplication })
      } catch (err) {
        logger.error(err)
        return _this.goToHomePage(req, res, {
          redirect: '/application-variable',
          error_message: err,
          application_id: applicationId
        })
      }
    } else {
      logger.info("Nothing to add");
    }


    return _this.goToHomePage(req, res, {
      redirect: '/application-variable',
      multiple_messages: resultMessages,
      application_id: applicationId
    })

  });

  expressInstance.post('/application-variable/action/local/variable/:mode/save', ["admin"], async (req, res) => {

    var variable = Utils.sanitizeObject(req.body);
    delete variable.application_id;
    delete variable.variable_id;

    variable.scope = 'L';

    if (req.body.variable_id) {
      variable.id = escape(req.body.variable_id);
    }

    let objectToLog = {
      ...variable
    };
    objectToLog.value = "****";
    logger.info(objectToLog);

    var application = await applicationRepository.findOneById(escape(req.body.application_id));

    if (typeof application !== 'undefined' && application.length == 0) {
      return res.render('application-variable/new_local_var.hbs', {
        error_message: "Application was not found",
        application_id: escape(req.body.application_id),
        application_name: application.name,
        mode: req.params.mode
      });
    }

    //safe value store
    if (variable.type === "S") {
      variable.value = aes256.encrypt(cryptKey, variable.value);
    }

    //if is a new variable (without id)
    if (typeof escape(req.body.id) !== 'undefined' && escape(req.params.mode) === "add") {
      //validate unique name
      var locaVariablesWhoAlreadyExist = await applicationVariableRepository.findVariableInApplication(application.name, variable.name, "L");

      if (typeof locaVariablesWhoAlreadyExist !== 'undefined' && locaVariablesWhoAlreadyExist.length > 0) {
        return res.render('application-variable/new_local_var.hbs', {
          error_message: "A variable already exist in this application with this name and local scope",
          application_id: escape(req.body.application_id),
          application_name: application.name,
          mode: req.params.mode
        });
      }

      var globalVariablesWhoAlreadyExist = await applicationVariableRepository.findVariableInApplication(application.name, variable.name, "G");

      if (typeof globalVariablesWhoAlreadyExist !== 'undefined' && globalVariablesWhoAlreadyExist.length > 0) {
        return res.render('application-variable/new_local_var.hbs', {
          error_message: "A variable already exist in this application with this name but with global scope",
          application_id: escape(req.body.application_id),
          application_name: application.name,
          mode: req.params.mode
        });
      }
    }

    //save variable
    variableRepository.save(variable, function (err, variableSaveResult) {
      if (err) {
        logger.error(`Error while trying to persist variable: ${err.code} ${err.sqlMessage}`);
        return res.render('application-variable/new_local_var.hbs', {
          error_message: "An error occurred when trying to save the variable.",
          application_id: escape(req.body.application_id),
          application_name: application.name,
          mode: req.params.mode
        });
      } else {
        logger.info("variable was created");
        // if variable is already created or updated, we just need add it
        // to  selected application
        if (!req.body.variable_id) {
          var application_variable = {
            application_id: escape(req.body.application_id),
            variable_id: variableSaveResult.insertId
          };
          applicationVariableRepository.save(application_variable, function (applicationVariableErr, applicationVariableResult) {

            if (applicationVariableErr) {
              logger.error(applicationVariableErr);
              logger.info("previously created variable will be deleted");
              variableRepository.delete(variableSaveResult.insertId, function (errDelete, deleteResult) {

                res.render('application-variable/new_local_var.hbs', {
                  error_message: "An error occurred when trying to save the variable.",
                  application_id: escape(req.body.application_id),
                  application_name: application.name,
                  mode: req.params.mode
                });
              });

            } else {
              _this.goToHomePage(req, res, {
                redirect: '/application-variable',
                success_message: "The variable was saved successfully.",
                application_id: escape(req.body.application_id)
              })
            }
          });
        } else {
          _this.goToHomePage(req, res, {
            redirect: '/application-variable',
            success_message: "The variable was edited successfully.",
            application_id: escape(req.body.application_id)
          })
        }
      }
    });
  });

  expressInstance.post('/application-variable/action/global/variable/add', ["admin"], (req, res) => {

    logger.info("Add global variables:");
    var body = Utils.sanitizeObject(req.body)
    logger.debug(body);

    var selectedApplicationId = body.application_id;

    var columns = ["application_id", "variable_id"];
    var variables_id = [];

    for (var key in body) {
      if (key.startsWith("global_var_id_selected_")) {
        variables_id.push(key.replace("global_var_id_selected_", ""))
      }
    }
    //show warning if variable already exist as global
    applicationVariableRepository.massiveSave(columns, selectedApplicationId, variables_id, function (applicationVariableErr, applicationVariableResult) {
      if (applicationVariableErr) {
        logger.info(applicationVariableErr);
        //TODO: Show error message in add global variable page instead home page
        _this.goToHomePage(req, res, {
          redirect: '/application-variable',
          error_message: "An error occurred when trying to add the variable. Application was not found"
        })
      } else {
        _this.goToHomePage(req, res, {
          redirect: '/application-variable',
          success_message: "The variables were added successfully.",
          application_id: body.application_id
        })
      }
    });

  });

  expressInstance.get('/application-variable/view/edit/:id/:application_id/:variable_id', ["admin"], async (req, res) => {
    var variable_id = escape(req.params.variable_id);
    variableRepository.findOneById(variable_id, async function (err, variable) {
      if (err) {
        logger.info(err);
        _this.goToHomePage(req, res, {
          error_message: "An error occurred when trying to get the variable."
        })
      } else {
        if (variable.type === "S") {
          variable.value = aes256.decrypt(cryptKey, variable.value);
        }

        var application = await applicationRepository.findOneById(escape(req.params.application_id));

        res.render('application-variable/new_local_var.hbs', {
          id: escape(req.params.id),
          application_id: escape(req.params.application_id),
          application_name: application.name,
          variable: variable,
          mode: "edit"
        });
      }
    });
  });

  expressInstance.get('/application-variable/view/read/:application_id/:variable_id', ["reader"], (req, res) => {

    applicationRepository.findOneById(escape(req.params.application_id), function (err, application) {
      if (err) {
        logger.info(err);
        _this.goToHomePage(req, res, {
          error_message: "An error occurred when trying to read the application."
        })
      } else {
        variableRepository.findOneById(escape(req.params.variable_id), function (err, entity) {
          if (err) {
            logger.info(err);
            _this.goToHomePage(req, res, {
              error_message: "An error occurred when trying to read the variable."
            })
          } else {

            entity.applicationFrom = application.name
            entity.originUrl = req.get('referer')

            if (entity.type === 'S') {
              entity.value = "*****"
            }

            res.render('application-variable/read_var.hbs', {
              id: req.params.id,
              application_id: escape(req.params.application_id),
              variable: entity
            });
          }
        });
      }
    });
  });

  expressInstance.get('/application-variable/view/delete/:id/:scope', ["admin"], (req, res) => {

    var id = escape(req.params.id);

    applicationVariableRepository.findOneById(id, function (err, applicationVariable) {
      if (err) {
        logger.info(err);
        _this.goToHomePage(req, res, {
          error_message: "An error occurred when trying to get the deletion page."
        })
      } else {

        variableRepository.findOneById(applicationVariable.variable_id, function (errVariable, variable) {
          if (errVariable) {
            logger.error(errVariable);
            _this.goToHomePage(req, res, {
              error_message: "An error occurred when trying to get the deletion page."
            })
          } else {
            applicationRepository.findOneById(applicationVariable.application_id, function (errApplication, application) {
              if (errApplication) {
                logger.error(errApplication);
                _this.goToHomePage(req, res, {
                  error_message: "An error occurred when trying to get the deletion page."
                })
              } else {
                res.render('common/delete.hbs', {
                  entityId: id,
                  additionalFormValues: [{
                    "name": "scope",
                    "value": req.params.scope
                  }],
                  warningMessage: "Are you sure you want to delete this {0} variable: \"{1}\" from this application \"{2}\"?".format(escape(req.params.scope), variable.name, application.name),
                  entityType: "application-variable",
                  "mode": "confirm"
                });
              }
            });
          }
        });
      }
    });
  });

  expressInstance.post('/application-variable/action/delete', ["admin"], (req, res) => {

    var id = escape(req.body.id);
    var variableScope = escape(req.body.scope);

    if (variableScope != "global" && variableScope != "local") {
      _this.goToHomePage(req, res, {
        error_message: "An error occurred when trying to delete the variable: Unknown scope"
      })
    }

    logger.info("Deleting variable from application. Relationship id:" + id);

    // validate existence of this application <> variable  relationship
    applicationVariableRepository.findOneById(id, function (selectionApplicationVariableErr, applicationVariable) {
      if (selectionApplicationVariableErr) {
        logger.error(selectionApplicationVariableErr);
        _this.goToHomePage(req, res, {
          redirect: '/application-variable',
          error_message: "An error occurred when trying to delete this variable.",
          application_id: applicationVariable.application_id
        })
        return;
      } else {

        logger.info("Relationship was found:" + applicationVariable)
        if (variableScope == "global") {
          // in this case we need to delete just the relationship
          applicationVariableRepository.delete(id, function (deletionApplicationVariableErr, deletionApplicationVariableResult) {
            if (deletionApplicationVariableErr) {
              logger.error(deletionApplicationVariableErr);
              _this.goToHomePage(req, res, {
                error_message: "An error occurred when trying to delete the variable."
              })
            } else {
              _this.goToHomePage(req, res, {
                redirect: '/application-variable',
                success_message: "The global variable was removed from the application successfully.",
                application_id: applicationVariable.application_id
              })
            }
          });

        } else if (variableScope == "local") {
          // first: delete the asociation variable <> application
          applicationVariableRepository.delete(id, function (deletionApplicationVariableErr, deletionApplicationVariableResult) {
            if (deletionApplicationVariableErr) {
              logger.error(deletionApplicationVariableErr);
              _this.goToHomePage(req, res, {
                error_message: "An error occurred when trying to delete the variable."
              })
            } else {
              // second: delete the orphan variable
              variableRepository.delete(applicationVariable.variable_id, function (variableDeletionErr, variableDeletionResult) {
                if (variableDeletionErr) {
                  logger.error(variableDeletionErr);
                  _this.goToHomePage(req, res, {
                    error_message: "An error occurred when trying to delete the variable."
                  })
                } else {
                  _this.goToHomePage(req, res, {
                    redirect: '/application-variable',
                    success_message: "The variable was deleted successfully.",
                    application_id: applicationVariable.application_id
                  })
                }
              });
            }
          });
        }
      }
    });
  });
}

module.exports = ApplicationVariableRouter;
