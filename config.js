const mysql = require('mysql');

const connection = mysql.createConnection({
    host: "localhost",
    user: "root",
    database: "test1",
    password: "123456789"
  });

  module.exports = connection;
 