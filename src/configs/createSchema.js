const pool = require("../services/db");

const database = pool.config.connectionConfig.database;

pool.config.connectionConfig.database = null;

const CHECK_DB_SQL = `
    SELECT * FROM INFORMATION_SCHEMA.SCHEMATA
    WHERE SCHEMA_NAME = ?
    `;

const CREATE_DB_SQL = `
    CREATE DATABASE IF NOT EXISTS ??
    `;

pool.query(CHECK_DB_SQL, [database], (error, results) => {
    if (error) {
        console.error("Error checking database:", error);
        process.exit(1);
    }

    if (results.length > 0) {
        console.log(`Database "${database}" already exists`);
        process.exit(0);
    }

    pool.query(CREATE_DB_SQL, [database], (error, results) => {
        if (error) {
            console.error("Error creating database:", error);
            process.exit(1);
        }

        console.log(`Database "${database}" created successfully`);
        process.exit(0);
    });
});
