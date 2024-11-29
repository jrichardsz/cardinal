function SearchVariableRepository() {

  this.findVariablesLikeName = function (variableName) {
    return new Promise(function (resolve, reject) {
      databaseConnection.getConnection(function (err, connection) {
        let sql = `
        select var.id, var.name, var.value, var.type, var.scope, app.name as app_name
        from variable var join application app join application_variable av 
        where var.name like ?
        and var.id = av.variable_id
        and var.deleted= 'N'
        and av.application_id = app.id
        
        UNION ALL
        
        select var.id, var.name, var.value, var.type, var.scope, '<not used>' as app_name
        from variable var
        where var.name like ?
        and var.scope = 'G'
        and var.deleted= 'N'
        and var.id not in (select av.variable_id  from application_variable av )          
        `;

        let variable_name = `%${variableName}%`;

        try {
          connection.query(sql, [variable_name, variable_name], function (err, results) {
            connection.release()
            if (err) {
              reject(err)
            }
            resolve(results)
          })
        } catch (err) {
          connection.release();
          reject(err);
        }
      })
    })
  }


}

module.exports = SearchVariableRepository