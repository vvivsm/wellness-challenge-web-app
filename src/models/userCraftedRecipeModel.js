// Name: Vivian Tan Xiu Li
// StudentID: 2518268
// Class: DAAA/FT/1B/06

const pool = require("../services/db");

module.exports.insertCrafted = (data, callback) => {
    const SQLSTATEMENT = `
        INSERT INTO UserCraftedRecipes (user_id, recipe_id)
        VALUES (?, ?);
    `;
    const VALUES = [data.user_id, data.recipe_id];
    pool.query(SQLSTATEMENT, VALUES, callback);
};