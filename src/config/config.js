// config.js

const mysql = require('mysql2');
require('dotenv').config()

const connection = mysql.createPool({
  host: process.env.db_host,       
  user: process.env.db_user,   
  password: process.env.db_password,
  database: process.env.database,
  connectionLimit: 10,
  queueLimit: 0
});

module.exports = connection.promise(); 


connection.getConnection((err, connection) => {
    if (err) {
      console.error('Error connecting to the database:', err.stack);
    } else {
      console.log('Successfully connected to the database');
      connection.release();
    }
  });