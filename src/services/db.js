require('dotenv').config();

const mysql = require('mysql2');

const setting = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    connectionLimit: 10,
    multipleStatements: true,
    dateStrings: true
}

const pool = mysql.createPool(setting);

module.exports = pool;
