var aes256 = require('aes256');
var escape = require('escape-html');

function ApiRouter(expressInstance) {
  var _this = this;

  var cryptKey = properties.security.cryptKey;

  var response400 = {
    "code": 400,
    "message": "Bad request"
  };

  var response500 = {
    "code": 500,
    "message": "Internal Error"
  };

  expressInstance.get('/api/v1/variables', ["api"], (req, res) => {
    getVariables(req, res, '"');
  });

  expressInstance.get('/api/v2/variables', ["api"], (req, res) => {
    getVariables(req, res, "'");
  });  

  function getVariables(req, res, valueDelimiterChar){
    var application = escape(req.query.application);
    var type = escape(req.query.type);

    logger.info("get variables for app: "+application)

    if(type === 'json' || type === 'env'){
      type = req.query.type;
    }else{
      type = 'env';
    }

    if(typeof req.query.application === 'undefined'){
      res.status(response400.code);
      createResponse(type, response400, res)
      return;
    }

    applicationVariableRepository.findVariablesByApplicationName(application, function(findVariablesByApplicationIdErr, variables) {

      if (findVariablesByApplicationIdErr) {
        logger.error(errVarApplications);
        res.status(response500.code);
        createResponse(type, response500, res)
        return;
      }

      if (variables && variables.length===0) {
        logger.error("zero variables were founded");
        res.status(response500.code);
        createResponse(type, response500, res)
        return;
      }

      //decrypt secret values
      for(variable of variables){
        if(variable.type === 'S'){
          variable.value = aes256.decrypt(cryptKey, variable.value);
        }
      }

      try{
        var parsedVariables = convertVariablesToRequiredFormat(type, variables, valueDelimiterChar);
        createResponse(type,parsedVariables, res);
      }catch(errParseVariables){
        logger.error("Failed to convert variables to type: "+type)
        res.status(response500.code);
        createResponse(type, response500, res)
        return;
      }
    });    
  }

  function createResponse(type, body, res){
    if(type === 'json'){
      res.json(body);
    }else{
      res.type('text/plain');
      res.send(body);
    }
  }

  function convertVariablesToRequiredFormat(type, variables, valueDelimiterChar){
    if(type === 'json'){
      var parsedVariables = [];
      variables.forEach(function(variableMetadata) {
        var key = variableMetadata.name;
        var value = variableMetadata.value;
        parsedVariables.push({
          "key":key,
          "value":value,
        });
      });

      var response = {
        "code": "200",
        "message": "success",
        "content": parsedVariables
      };

      return response;

    }else{ //default is env
      var exportText = '';
      variables.forEach(function(variableMetadata) {
        var key = variableMetadata.name;
        var value = variableMetadata.value;
        exportText =
          exportText +
          'export ' +
          key +
          '=' +
          valueDelimiterChar +
          value +
          valueDelimiterChar +
          ' \n';
      });
      return exportText;
    }
  }

}

module.exports = ApiRouter;
