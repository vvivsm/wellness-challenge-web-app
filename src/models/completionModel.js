// Name: Vivian Tan Xiu Li
// StudentID: 2518268
// Class: DAAA/FT/1B/06

const pool = require('../services/db');

module.exports.insertCompletion = (data, callback) => {
    const SQLSTATEMENT = `
        INSERT INTO UserCompletion (challenge_id, user_id, details)
        VALUES (?, ?, ?);
    `;
    const VALUES = [data.challenge_id, data.user_id, data.details];
    pool.query(SQLSTATEMENT, VALUES, callback);
};

module.exports.selectById = (data, callback) => {
    const SQLSTATEMENT = `
        SELECT * FROM UserCompletion
        WHERE id = ?;
    `;
    pool.query(SQLSTATEMENT, [data.id], callback);
};