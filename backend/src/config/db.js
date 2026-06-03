const mysql = require("mysql2");
require("dotenv").config();

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Export the promise-based wrapper for async/await usage
const promisePool = pool.promise();

// Verify connectivity on startup
promisePool
  .getConnection()
  .then((connection) => {
    console.log("Connected to MySQL database via connection pool");
    connection.release();
  })
  .catch((err) => {
    console.error("Database connection failed:", err.message);
  });

module.exports = promisePool;