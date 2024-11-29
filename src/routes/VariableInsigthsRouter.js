function VariableInsigthsRouter(expressInstance) {
  var _this = this;

  expressInstance.get('/insights/variable', ["admin", "reader"], (req, res) => {
    _this.goToHomePage(req, res)
  })

  this.goToHomePage = async function (req, res, redirectAttributes) {
    let renderAttributes = {
      userRole: req.session.loginInformation.role || undefined
    };

    if (typeof redirectAttributes !== 'undefined') {
      renderAttributes = {
        ...renderAttributes,
        ...redirectAttributes
      }

      if (redirectAttributes.hasOwnProperty('error_message') ||
        redirectAttributes.hasOwnProperty('error_security_message')) {
        res.render('search-variable/home.hbs', renderAttributes)
        return
      }
    }

    if(req.query.value_search){
      let variableName = req.query.value_search.trim();
      logger.info(`Search variable: ${variableName}`);
      try {
        let result = await searchVariableRepository.findVariablesLikeName(variableName);
        logger.info(variableName)
        
        renderAttributes = {
          ...renderAttributes,
          ...{
            resultVariable: result,
            variableName
          }
        }
        
        res.render('search-variable/home.hbs', renderAttributes)
      } catch (err) {
        logger.info(err)
        _this.goToHomePage(req, res, {
          error_message: `An error occurred while searching the variable: ${variableName}`
        })
      }
    }else{
      res.render('search-variable/home.hbs', renderAttributes)
    }

    

  }
}

module.exports = VariableInsigthsRouter;