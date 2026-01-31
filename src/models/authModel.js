//////////////////////////////////////////////////////
// REQUIRE MODULES
//////////////////////////////////////////////////////
const pool = require('../services/db');

// Check Username or Email Exist
module.exports.checkUsernameOrEmailExist = (data, callback) => {

    const SQLSTATEMENT = `
        SELECT * FROM Users
        WHERE username = ? OR email = ?
    `;

    const VALUES = [data.username, data.email];

    pool.query(SQLSTATEMENT, VALUES, callback);
};

//////////////////////////////////////////////////////
// SELECT USER BY USERNAME
//////////////////////////////////////////////////////
module.exports.selectUserByUsername = (data, callback) => {
    const SQLSTATEMENT = `
        SELECT * FROM Users
        WHERE username = ?;
        `;
    const VALUES = [data.username];

    pool.query(SQLSTATEMENT, VALUES, callback);
};

//////////////////////////////////////////////////////
// SELECT USER BY USERNAME OR EMAIL
//////////////////////////////////////////////////////
module.exports.selectUserByUsernameOrEmail = (data, callback) => {
    const SQLSTATEMENT = `
        SELECT * FROM Users
        WHERE username = ? OR email = ?;
        `;
    const VALUES = [data.username, data.email];

    pool.query(SQLSTATEMENT, VALUES, callback);
};

//////////////////////////////////////////////////////
// INSERT USER
//////////////////////////////////////////////////////
module.exports.insertUser = (data, callback) => {
    const SQLSTATEMENT = `
        INSERT INTO Users (username, email, password)
        VALUES (?, ?, ?);
        `;
    const VALUES = [data.username, data.email, data.password];

    pool.query(SQLSTATEMENT, VALUES, callback);
};