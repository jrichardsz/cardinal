function ApplicationUserRepository() {

  this.findAll = function (callback) {
    databaseConnection.getConnection(function (err, connection) {
      connection.query('select * from authentication',
        function (err, rows) {
          connection.release()
          callback(err, rows)
        }
      )
    })
  }

  this.findOneById = function (id, callback) {
    if (typeof callback === 'undefined') {
      return new Promise(function (resolve, reject) {
        databaseConnection.getConnection(function (err, connection) {
          connection.query('select * from authentication where id = ?', id, function (err, rows) {
            connection.release()
            if (err) {
              reject(err)
            }
            logger.info(rows)
            if (rows.length > 1) {
              reject("More than one row was found for id:" + id)
            } else {
              resolve(rows[0])
            }
          })
        })
      })
    }

    databaseConnection.getConnection(function (err, connection) {
      connection.query('select * from authentication where id = ?', id, function (err, rows) {
        connection.release()
        if (err) callback(err, rows)

        if (rows.length > 1)
          callback("More than one row was found for id:" + id, null)
        else callback(null, rows[0])
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
        var sql = `UPDATE authentication
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
        
        var sql = `INSERT INTO authentication
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

  this.delete = function (id, callback) {
    var params = [id];
    var sql = `DELETE FROM authentication
                WHERE id = ?`;

    databaseConnection.getConnection(function (err, connection) {
      connection.query(sql, params, function (err, result) {
        connection.release();
        callback(err, result)
      })
    })
  }

}

module.exports = ApplicationUserRepository;