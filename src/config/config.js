// config.js

const mysql = require('mysql2');

const connection = mysql.createPool({
  host: 'localhost',       
  user: 'root',   
  password: 'root',
  database: 'test' 
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