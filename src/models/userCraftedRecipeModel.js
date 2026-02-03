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

// Check if a user has already crafted a recipe
module.exports.selectUserCrafted = (data, callback) => {
    const SQL = `
    SELECT id, user_id, recipe_id, crafted_at
    FROM UserCraftedRecipes
    WHERE user_id = ? AND recipe_id = ?
    LIMIT 1
  `;

    const VALUES = [data.user_id, data.recipe_id];

    pool.query(SQL, VALUES, callback);
};

// Get all crafted recipes for a user (for UI: show CRAFTED ✓)
module.exports.selectCraftedByUser = (data, callback) => {
    const SQL = `
    SELECT id, user_id, recipe_id, crafted_at
    FROM UserCraftedRecipes
    WHERE user_id = ?
    ORDER BY crafted_at DESC
  `;

    const VALUES = [data.user_id];

    pool.query(SQL, VALUES, callback);
};
