// config/mysql.js
const mysql = require('mysql2');
require('dotenv').config();

const pool = mysql.createPool({
  host:     process.env.MYSQL_HOST     || 'localhost',
  port:     process.env.MYSQL_PORT     || 3306,
  user:     process.env.MYSQL_USER     || 'root',
  password: process.env.MYSQL_PASSWORD || '',
  database: process.env.MYSQL_DB       || 'recruitment_db',
  waitForConnections: true,
  connectionLimit:    10,
  queueLimit:         0
});

// Test connection on startup
pool.getConnection((err, connection) => {
  if (err) {
    console.error('❌  MySQL connection failed:', err.message);
  } else {
    console.log('✅  MySQL connected successfully');
    connection.release();
  }
});

module.exports = pool.promise();
