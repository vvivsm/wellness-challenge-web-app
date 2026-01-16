// Load environment variables
require('dotenv').config();

// Import MySQL2 module
const mysql = require('mysql2');

// Configure connection pool settings
const setting = {
    host: process.env.DB_HOST,          // Hostname or IP address where MySQL server runs
    user: process.env.DB_USER,          // Database username for Node app to log in with
    password: process.env.DB_PASSWORD,  // Database password for Node app to log in with
    database: process.env.DB_DATABASE,  // Specific database for Node app to connect to
    connectionLimit: 10,                // Limit concurrent active database connections
    multipleStatements: true,           // Allow multiple SQL statements in single query
    dateStrings: true                   // Return dates as strings instead of Date objects
}

// Create connection pool to MySQL server
const pool = mysql.createPool(setting);

// Export connection pool
module.exports = pool;
