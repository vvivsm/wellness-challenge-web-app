// Import connection pool
const pool = require("../services/db");

// Extract database name from pool configuration settings (from db.js)
const database = pool.config.connectionConfig.database;

// Temporarily remove database name from settings so pool connects to MySQL server itself
pool.config.connectionConfig.database = null;

// Define SQL statement to check if database exists
// INFORMATION_SCHEMA.SCHEMATA is a system table listing all databases
// Single question mark (?) = Value placeholder (plain strings/numbers)
const CHECK_DB_SQL = `
    SELECT * FROM INFORMATION_SCHEMA.SCHEMATA
    WHERE SCHEMA_NAME = ?
    `;

// Define SQL statement to create database if not exists
// Double question mark (??) = Identifier placeholder (column/table names)
const CREATE_DB_SQL = `
    CREATE DATABASE IF NOT EXISTS ??
    `;

// Check if database exists
pool.query(CHECK_DB_SQL, [database], (error, results) => {
    if (error) {
        console.error("Error checking database:", error);
        process.exit(1);
    }

    // If exists, exit early
    if (results.length > 0) {
        console.log(`Database "${database}" already exists:`, results);
        process.exit(0);
    }

    // Create database if not exists
    pool.query(CREATE_DB_SQL, [database], (error, results) => {
        if (error) {
            console.error("Error creating database:", error);
            process.exit(1);
        }

        console.log(`Database "${database}" created successfully:`, results);
        process.exit(0);
    });
});
