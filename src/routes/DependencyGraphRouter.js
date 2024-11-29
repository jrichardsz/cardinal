function DependencyGraphRouter(expressInstance) {
  var _this = this;

  expressInstance.get('/insights/dependency-graph', ["admin", "reader"], (req, res) => {
    _this.goToHomePage(req, res)
  })

  this.goToHomePage = function (req, res, redirectAttributes) {
    let renderAttributes = {
      ...redirectAttributes,
      ...{
        javascriptModule: 'dependency-graph'
      },
      userRole: req.session.loginInformation.role || undefined
    }

    res.render('dependency-graph/home.hbs', renderAttributes)
  }

  expressInstance.get('/insights/dependency-graph/view/graph', ["admin", "reader"], async (req, res) => {
    let globalVarName = req.query.global_var_name;

    let renderAttributes = {
      globalVarName,
      graph: false
    }

    applicationVariableRepository.findApplicationByGlobalVariableName(globalVarName, async (err, applications) => {

      if (err) {
        renderAttributes.error_message = `An error occurred while trying to find the global variable: ${globalVarName}`;
      }

      if (applications.length === 0) {
        renderAttributes.success_message = `There are no search results for '${globalVarName}'`;

        let searchMatches = await applicationVariableRepository.findVariablesLikeVariableName(globalVarName)

        if (searchMatches.length > 0) {
          renderAttributes.success_message += ', maybe you wanted to search:';

          let count = 0;
          for (const searchMatche of searchMatches) {
            renderAttributes.success_message +=
              `${count === 0
                ? ' '
                : count + 1 === searchMatches.length
                  ? ' o '
                  : ', '}'${searchMatche.name}'`
            count++;
          }
        }
      }

      if (applications.length > 0) {
        renderAttributes.graph = true;

        let dot = 'digraph {';
        let count = 1;
        let nodeIdentifiers = `var [label="${globalVarName}"];`;
        let nodeRelations = '';

        for (const application of applications) {
          nodeIdentifiers += `\n${count} [label="${application.name} - ${application.type}"];`;
          nodeRelations += `\nvar -> ${count};`
          count++;
        }

        dot += nodeIdentifiers;
        dot += nodeRelations;

        dot += '}';

        renderAttributes.dot = dot;
      }

      _this.goToHomePage(req, res, renderAttributes)
    })

  })
}

module.exports = DependencyGraphRouter