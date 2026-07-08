const pool = require('../services/db');

module.exports.selectAll = (callback) => {
    const SQLSTATEMENT = `
        SELECT * FROM Ingredients
    `;
    pool.query(SQLSTATEMENT, callback);
};

module.exports.selectById = (data, callback) => {
    const SQLSTATEMENT = `
        SELECT * FROM Ingredients
        WHERE id = ?;
    `;
    pool.query(SQLSTATEMENT, [data.ingredient_id], callback);
};