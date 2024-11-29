function ApplicationRepository() {

  this.findAll = function (callback) {
    databaseConnection.getConnection(function (err, connection) {
      connection.query('select * from application', function (err, rows) {
        connection.release();
        callback(err, rows);
      });
    });
  }

  this.findByDeleted = function (deleted, callback) {
    var params = [deleted];
    databaseConnection.getConnection(function (err, connection) {
      connection.query('select * from application where deleted = ? order by name', params, function (err, rows) {
        connection.release();
        callback(err, rows);
      });
    });
  }

  this.findOneById = function (id, callback) {

    // is not callback
    if (typeof callback === 'undefined') {
      return new Promise(function (resolve, reject) {
        databaseConnection.getConnection(function (err, connection) {
          connection.query('select * from application where id = ?', [id], function (err, rows) {
            connection.release();
            if (err) {
              reject(err);
            }
            if (rows.length > 1) {
              reject("More than one row was found for id:" + id);
            } else {
              resolve(rows[0]);
            }
          });
        });
      });
    }

    //is a callback
    databaseConnection.getConnection(function (err, connection) {
      connection.query('select * from application where id = ?', [id], function (err, rows) {
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

  this.findByName = function (name, callback) {
    databaseConnection.getConnection(function (err, connection) {
      connection.query('select * from application where name = ?', [name], function (err, rows) {
        connection.release();
        callback(err, rows);
      });
    });
  }

  this.findByNameAndDeleted = function (name, deleted) {
    return new Promise(function (resolve, reject) {
      var params = [`%${name}%`, deleted];
      databaseConnection.getConnection(function (err, connection) {
        connection.query("select * from application where name like ? and deleted = ?", params, function (err, rows) {
          connection.release();
          if (err) {
            reject(err)
          }

          resolve(rows)
        })
      })
    })
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

        var sql = `INSERT INTO application
                   (@columns)
                   VALUES(@jokers)`;
        sql = sql.replace("@columns", columns.toString());
        sql = sql.replace("@jokers", jokers.toString());

        connection.query(sql, values, function (errInsert, result) {
          connection.release();
          callback(errInsert, result);
        });
      }
    });
  }

  this.logicDelete = function (id, callback) {
    databaseConnection.getConnection(function (err, connection) {
      // just turn delete column to 'Y'
      var sql = `UPDATE application
                 SET deleted = 'Y'
                 WHERE id = ?`;
      connection.query(sql, [id], function (errDelete, result) {
        connection.release();
        callback(errDelete, result);
      });
    });
  }

  this.delete = function (id, callback) {
    var params = [id];

    var sql = `DELETE FROM application
               WHERE id=?`;

    databaseConnection.getConnection(function (conecctionErr, connection) {
      connection.query(sql, params, function (deletionErr, deletionResult) {
        connection.release();
        callback(deletionErr, deletionResult);
      });
    });
  }

}


module.exports = ApplicationRepository;
