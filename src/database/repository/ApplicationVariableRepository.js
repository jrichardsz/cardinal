function ApplicationVariableRepository() {

  this.findOneById = function (id, callback) {
    databaseConnection.getConnection(function (err, connection) {
      connection.query('select * from application_variable where id = ?', [id], function (err, rows) {
        if (err) {
          connection.release();
          callback(err, rows);
        }

        if (rows.length == 0) {
          callback("Zero rows were found for id:" + id, null);
        } else if (rows.length > 1) {
          callback("More than one row was found for id:" + id, null);
        } else {
          callback(null, rows[0]);
        }
      });
    });
  }

  this.findVariablesByApplicationId = function (applicationId, callback) {
    databaseConnection.getConnection(function (err, connection) {

      var sql = `select av.id, av.variable_id, v.name, v.value, v.description, v.type, v.scope
                 from application_variable av, variable v
                 where av.application_id = ? and av.variable_id = v.id
                 order by scope, v.name`;
      try {
        connection.query(sql, [applicationId], function (err, selectResult) {
          connection.release();
          if (err) {
            callback(err, null);
          }
          callback(null, selectResult);
        });
      } catch (connectionErr) {
        connection.release();
        callback(connectionErr, null);
      }
    });
  }

  this.findVariablesByApplicationName = function (applicationName, callback) {
    databaseConnection.getConnection(function (err, connection) {

      var sql = `select
                	av.id,
                	av.variable_id,
                	v.name,
                	v.value,
                	v.description,
                	v.type,
                	v.scope
                from
                	application_variable av,
                	variable v,
                	application ap
                where
                	ap.name = ?
                	and av.application_id = ap.id
                	and av.variable_id = v.id
                  order by v.scope, v.name`;
      try {
        connection.query(sql, [applicationName], function (err, selectResult) {
          connection.release();
          if (err) {
            callback(err, null);
          }
          callback(null, selectResult);
        });
      } catch (connectionErr) {
        connection.release();
        callback(connectionErr, null);
      }
    });
  }

  this.findVariablesLikeVariableName = function (variableName) {
    return new Promise(function (resolve, reject) {
      databaseConnection.getConnection(function (err, connection) {
        let sql = `
          select var.name
            from variable var
           where var.name like ?
        `;
        let variable_name = `%${variableName}%`;

        try {
          connection.query(sql, [variable_name], function (err, results) {
            connection.release();
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

  this.findApplicationByGlobalVariableName = function (globalVarName, callback) {
    databaseConnection.getConnection(function (err, connection) {
      let sql = `select app.name, app.description, app.type
                   from application app, variable var,
                        application_variable app_var
                  where app.id = app_var.application_id
                    and var.id = app_var.variable_id
                    and var.name = ?
                  order by app.type, app.name`;

      try {
        connection.query(sql, [globalVarName], function (err, result) {
          connection.release();
          if (err) {
            callback(err, null)
          }
          callback(null, result)
        })
      } catch (err) {
        connection.release();
        callback(err, null);
      }
    })
  }

  this.findVariableInApplication = function (applicationName, variableName, variableScope) {
    return new Promise(function (resolve, reject) {
      databaseConnection.getConnection(function (err, connection) {

        var sql = `select
                  	av.id,
                  	av.variable_id,
                  	v.name,
                  	v.value,
                  	v.description,
                  	v.type,
                  	v.scope
                  from
                  	application_variable av,
                  	variable v,
                  	application ap
                  where
                  	ap.name = ?
                  	and av.application_id = ap.id
                  	and av.variable_id = v.id
                  	and v.name = ?
                  	and v.scope = ?`;
        try {
          connection.query(sql, [applicationName, variableName, variableScope], function (err, rows) {
            connection.release();
            if (err) {
              reject(err);
            }
            resolve(rows);
          });
        } catch (connectionErr) {
          connection.release();
          reject(connectionErr);
        }
      });
    })
  }

  this.findVariableInApplicationById = function (applicationId, variableName) {
    return new Promise(function (resolve, reject) {
      databaseConnection.getConnection(function (err, connection) {
        let sql = `
          select av.id,
                 av.variable_id,
                 v.name,
                 v.value,
                 v.description,
                 v.type,
                 v.scope
            from application_variable av,
                 variable v,
                 application ap
           where ap.id = ?
             and av.application_id = ap.id
             and av.variable_id = v.id
             and v.name like ?
        `;
        let params = [applicationId, `%${variableName}%`];

        connection.query(sql, params, function (err, rows) {
          connection.release();
          if (err) {
            reject(err);
          }
          resolve(rows);
        })
      })
    })
  }

  this.findApplicationAndVariableById = function (id, callback) {
    databaseConnection.getConnection(function (err, connection) {
      var sql = `select av.id, a.name as application_name,v.name as variable_name
                 from  application_variable av,application a, variable v
                 where av.id = ? and
                 a.id = av.application_id and
                 v.id = av.variable_id`;
      try {
        connection.query(sql, [id], function (err, rows) {
          connection.release();
          if (err) {
            callback(err, rows);
          }
          callback(null, rows);
        });
      } catch (connectionErr) {
        connection.release();
        callback(connectionErr, null);
      }
    });
  }

  this.findApplicationsByVariableById = function (variableId, callback) {
    databaseConnection.getConnection(function (err, connection) {
      var sql = `select ap.name from application ap , application_variable av
                 where av.variable_id = ? && av.application_id = ap.id`;
      try {
        connection.query(sql, [variableId], function (err, rows) {
          connection.release();
          if (err) {
            callback(err, rows);
          }
          callback(null, rows);
        });
      } catch (connectionErr) {
        connection.release();
        callback(connectionErr, null);
      }
    });
  }

  this.save = function (entity, callback) {
    databaseConnection.getConnection(function (err, connection) {
      if (entity.id) {
        logger.info("Update action")
        var columns = [];
        var params = [];
        for (key in entity) {
          if (entity[key]) {
            if (key != "id") {
              columns.push(key + "=?");
              params.push(entity[key]);
            }
          }
        }

        params.push(entity.id);

        // update statment
        var sql = `UPDATE application
                   SET @columns
                   WHERE id = ?`;

        sql = sql.replace("@columns", columns.toString());
        logger.info(sql);

        connection.query(sql, params, function (errUpdate, result) {
          connection.release();
          callback(errUpdate, result);
        });

      } else {
        logger.info("Insert action")
        var values = [];
        var columns = [];
        var jokers = [];
        for (key in entity) {
          if (key != "id") {
            values.push(entity[key]);
            columns.push(key);
            jokers.push("?");
          }
        }

        var sql = `INSERT INTO application_variable
                   (@columns)
                   VALUES(@jokers)`;
        sql = sql.replace("@columns", columns.toString());
        sql = sql.replace("@jokers", jokers.toString());
        logger.info(sql);
        connection.query(sql, values, function (errInsert, result) {
          connection.release();
          callback(errInsert, result);
        });
      }
    });
  }

  this.massiveSave = function (columns, application_id, variables_id, callback) {
    databaseConnection.getConnection(function (err, connection) {
      logger.info("Massive Insert action")

      var values = "";

      for (var i = 0; i < variables_id.length; i++) {
        values += `(${application_id}, ${variables_id[i]})`;
        if (i < variables_id.length - 1) { //is the last
          values += ",";
        }
      }

      var sql = `INSERT INTO application_variable
                 (@columns)
                 VALUES
                 @values`;
      sql = sql.replace("@columns", columns.toString());
      sql = sql.replace("@values", values.toString());
      logger.info(sql);
      connection.query(sql, values, function (errInsert, result) {
        connection.release();
        callback(errInsert, result);
      });
    });
  }

  this.delete = function (id, callback) {
    var params = [id];

    var sql = `DELETE FROM application_variable
               WHERE id=?`;

    databaseConnection.getConnection(function (conecctionErr, connection) {
      connection.query(sql, params, function (deletionErr, deletionResult) {
        connection.release();
        callback(deletionErr, deletionResult);
      });
    });
  }

  this.findAlreadyExistentVariablesInApplicationByNamesAndScope = function (applicationId, variableNames, scope) {
    return new Promise(function (resolve, reject) {
      databaseConnection.getConnection(function (getConnectionErr, connection) {
        if (getConnectionErr) {
          reject(getConnectionErr);
        }
        var sql = `
        select
        	v.id,
        	v.name,
        	v.value,
        	v.description,
        	v.type,
        	v.scope
        from
        	application_variable av,
        	variable v
        where
        	av.application_id = ?
        	and av.variable_id = v.id
        	and v.name in (?)
          and v.scope = ?
        `;
        connection.query(sql, [applicationId, variableNames, scope], function (err, rows) {
          connection.release();
          if (err) {
            reject(err);
          }
          resolve(rows);
        });
      });
    })
  }

  //deprecated
  this.findAlreadyExistentLocalVariablesInApplication = function (variableNames, callback) {
    databaseConnection.getConnection(function (err, connection) {
      var sql = `
      select
      	v.name ,
      	v.scope,
      	a.name
      from
      	application_variable av,
      	variable v,
      	application a
      where
      	av.variable_id = v.id
      	and a.id = av.application_id
      	and v.scope = 'L'
        and v.name in (?)
      `;
      try {
        connection.query(sql, [variableNames], function (err, rows) {
          connection.release();
          if (err) {
            callback(err, rows);
          }
          callback(null, rows);
        });
      } catch (connectionErr) {
        callback(connectionErr, null);
      }
    });
  }

  this.bulkInsert = function (columns, variables) {
    return new Promise(function (resolve, reject) {
      databaseConnection.getConnection(function (getConnectionErr, connection) {
        if (getConnectionErr) {
          reject(getConnectionErr);
        }
        var sql = `INSERT into application_variable (@columns) VALUES ?`;
        sql = sql.replace("@columns", columns.toString());
        connection.query(sql, [variables], function (err, result) {
          connection.release();
          if (err) {
            reject(err);
          }
          resolve(result);
        });
      });
    })
  }

}

module.exports = ApplicationVariableRepository;
