function ApplicationApikeyRepository() {
  this.findAll = function (callback) {
    databaseConnection.getConnection(function (err, connection) {
      connection.query('select * from apikey',
        function (err, rows) {
          connection.release();
          callback(err, rows)
        }
      )
    })
  }

  this.save = function (entity, callback) {
    databaseConnection.getConnection(function (err, connection) {
      var values = [];
      var columns = [];
      var jokers = [];
      for (const key in entity) {
        if (key != "id") {
          values.push(entity[key]);
          columns.push(key);
          jokers.push("?")
        }
      }

      var sql = `INSERT INTO apikey
                 (@columns)
                 VALUES (@jokers)`;
      sql = sql.replace("@columns", columns.toString())
      sql = sql.replace("@jokers", jokers.toString())

      connection.query(sql, values, function (errInsert, result) {
        connection.release()
        callback(errInsert, result)
      })
    })
  }

  this.delete = function (callback) {
    databaseConnection.getConnection(function (err, connection) {
      connection.query('delete from apikey', null,
        function (err, result) {
          connection.release()
          callback(err, result)
        }
      )
    })
  }
}

module.exports = ApplicationApikeyRepository