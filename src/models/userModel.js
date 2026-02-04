// Name: Vivian Tan Xiu Li
// StudentID: 2518268
// Class: DAAA/FT/1B/06

const pool = require('../services/db');

module.exports.insertNew = (data, callback) => {
    const SQLSTATEMENT = `
        INSERT INTO Users (username)
        VALUES (?)
    `;

    const VALUES = [data.username]

    pool.query(SQLSTATEMENT, VALUES, callback);
}

module.exports.selectAll = (callback) => {
    const SQLSTATEMENT = `
        SELECT * FROM Users;
    `;

    pool.query(SQLSTATEMENT, callback);
}

module.exports.selectById = (data, callback) => {
    const SQLSTATEMENT = `
        SELECT * FROM Users
        WHERE id = ?;
    `;

    const VALUES = [data.id]

    pool.query(SQLSTATEMENT, VALUES, callback);
}

module.exports.selectByUsernameExcludingUser = (data, callback) => {
    const SQL = `
        SELECT id
        FROM Users
        WHERE username = ?
          AND id <> ?
        LIMIT 1
    `;
    const VALUES = [data.username, data.user_id];

    pool.query(SQL, VALUES, callback);
};

module.exports.updateById = (data, callback) => {
    const SQLSTATEMENT = `
        UPDATE Users
        SET username = ? 
        WHERE id = ?;
    `;
    pool.query(SQLSTATEMENT, [data.username, data.id], callback);
};

module.exports.addPoints = (data, callback) => {
    const SQLSTATEMENT = `
        UPDATE Users u
        INNER JOIN Wellnesschallenge c on c.id = ?
        SET u.points = u.points + c.points
        WHERE u.id = ?;
    `;
    pool.query(SQLSTATEMENT, [data.challenge_id, data.user_id], callback);
};

module.exports.deductPoints = (data, callback) => {
    const SQLSTATEMENT = `
        UPDATE Users 
        SET points = points - ?
        WHERE id = ? AND points >= ?;
    `;
    const VALUES = [data.cost, data.user_id, data.cost];
    pool.query(SQLSTATEMENT, VALUES, callback);
};