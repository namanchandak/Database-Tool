const mysql = require("mysql2");
require("dotenv").config();

const connection = mysql.createConnection({
  host: process.env.db_host,
  user: process.env.db_user,
  password: process.env.db_password,
});

module.exports = connection.promise();

connection.connect(function (err) {
  if (err) throw err;
  console.log("Connected!");

  // Create the database
  connection.query(
    `CREATE DATABASE IF NOT EXISTS ReportToolDatabase;`,
    function (err) {
      if (err) throw err;

      // Use the newly created database
      connection.query(
        `USE ReportToolDatabase;`,
        function (err) {
          if (err) throw err;

          // Create the table
          connection.query(
            `CREATE TABLE IF NOT EXISTS saved_queries (
              query_name VARCHAR(30) UNIQUE,
              query VARCHAR(400) UNIQUE
            );`,
            function (err) {
              if (err) throw err;
              console.log("Database and table created successfully!");
              connection.end(); // Close the connection
            }
          );
        }
      );
    }
  );
});
