function VariableRepository() {

  this.findOneById = function(id, callback) {
    databaseConnection.getConnection(function(err, connection) {
      connection.query('select * from variable where id = ?', [id], function(err, rows) {
        connection.release();
        if (err) {
          callback(err, rows);
        }

        if (rows.length > 1) {
          callback("More than one row was found for id:" + id, null);
        } else {
          callback(null, rows[0]);
        }

      });
    });
  }

  this.findByScopeAndDeleted = function(scope,deleted, callback) {
    var params = [scope,deleted];
    databaseConnection.getConnection(function(err, connection) {
      connection.query('select * from variable where scope = ? and deleted = ? order by name', params, function(err, rows) {
        connection.release();
        callback(err, rows);
      });
    });
  }

  this.findByNameAndDeleted = function (name, deleted) {

    return new Promise(function (resolve, reject) {
      var params = [name,deleted];
      databaseConnection.getConnection(function(err, connection) {
        connection.query('select * from variable where name = ? and deleted = ?', params, function(err, rows) {
          connection.release();
          if (err) {
            reject(err);
          }
          resolve(rows);
        });
      });
    });
  }

  this.findByNameAndScopeAndDeleted = function (name, scope, deleted) {
    return new Promise(function (resolve, reject) {
      var params = [name, scope, deleted];
      databaseConnection.getConnection(function(err, connection) {
        connection.query('select * from variable where name = ? and scope = ? and deleted = ?', params, function(err, rows) {
          connection.release();
          if (err) {
            reject(err);
          }
          resolve(rows);
        });
      });
    });
  }

  this.findLikeByNameAndScopeAndDeleted = function (name, scope, deleted) {
    return new Promise(function (resolve, reject) {
      var params = [`%${name}%`, scope, deleted];
      databaseConnection.getConnection(function(err, connection) {
        connection.query('select * from variable where name like ? and scope = ? and deleted = ?', params, function(err, rows) {
          connection.release();
          if (err) {
            reject(err);
          }
          resolve(rows);
        });
      });
    });
  }

  this.save = function(entity, callback) {
    databaseConnection.getConnection(function(err, connection) {
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
        var sql = `UPDATE variable
                   SET @columns
                   WHERE id = ?`;

        sql = sql.replace("@columns", columns.toString());
        logger.debug(sql);

        connection.query(sql, params, function(errUpdate, result) {
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

        var sql = `INSERT INTO variable
                   (@columns)
                   VALUES(@jokers)`;
        sql = sql.replace("@columns", columns.toString());
        sql = sql.replace("@jokers", jokers.toString());

        connection.query(sql, values, function(errInsert, result) {
          connection.release();
          callback(errInsert, result);
        });
      }
    });
  }

  this.saveWithPromise = function(entity) {
    return new Promise(function (resolve, reject){
      databaseConnection.getConnection(function(err, connection) {
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
          var sql = `UPDATE variable
                     SET @columns
                     WHERE id = ?`;

          sql = sql.replace("@columns", columns.toString());
          logger.debug(sql);

          connection.query(sql, params, function(errUpdate, result) {
            connection.release();
            if(errUpdate){
              reject(errUpdate);
            }else{
              resolve(result)
            }
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

          var sql = `INSERT INTO variable
                     (@columns)
                     VALUES(@jokers)`;
          sql = sql.replace("@columns", columns.toString());
          sql = sql.replace("@jokers", jokers.toString());

          connection.query(sql, values, function(errInsert, result) {
            connection.release();
            if(errInsert){
              reject(errInsert);
            }else{
              resolve(result)
            }
          });
        }
      });
    });
  }

  this.delete = function(id, callback) {
    var params = [id];

    var sql = `DELETE FROM variable
               WHERE id=?`;

    databaseConnection.getConnection(function(conecctionErr, connection) {
      connection.query(sql, params, function(deletionErr, deletionResult) {
        connection.release();
        callback(deletionErr, deletionResult);
      });
    });
  }

  /*
  input collection must have the same columns, in the same order
  https://stackoverflow.com/questions/39270007/get-inserted-ids-of-multiple-insert-statements
  https://stackoverflow.com/questions/8899802/how-do-i-do-a-bulk-insert-in-mysql-using-node-js/34503558#34503558
  https://stackoverflow.com/questions/45076191/mysql-bulk-insert-in-node-js-how-to-get-all-insertids
  https://github.com/mysqljs/mysql/issues/1284
  */
  this.bulkInsert = function(columns, variables) {
    return new Promise(function (resolve, reject) {
      databaseConnection.getConnection(function(getConnectionErr, connection) {
        if (getConnectionErr) {
          reject(getConnectionErr);
        }
        var sql = `INSERT into variable (@columns) VALUES ?`;
        sql = sql.replace("@columns", columns.toString());

        //create a new array instead to objects arrays
        //https://stackoverflow.com/a/68596834/3957754
        var rows = variables.map(row => [row.name, row.value, row.description, row.type, row.scope]);
        connection.query(sql, [rows], function(err, result) {
          connection.release();
          if (err) {
            reject(err);
          }
          resolve(result);
        });
      });
    })
  }


  this.findVariablesByNamesAndScope = function(names,scope) {
    return new Promise(function (resolve, reject) {
      databaseConnection.getConnection(function(getConnectionErr, connection) {
        if (getConnectionErr) {
          reject(getConnectionErr);
        }
        var sql = 'select * from variable where name in (?) and scope = ? ';
        connection.query(sql, [names, scope], function(err, rows) {
          connection.release();
          if (err) {
            reject(err);
          }
          resolve(rows);
        });
      });
    })
  }

}

module.exports = VariableRepository;
