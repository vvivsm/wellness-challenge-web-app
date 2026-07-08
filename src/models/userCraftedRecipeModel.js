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
        SELECT 
            ucr.id,
            ucr.user_id,
            ucr.recipe_id,
            r.name AS recipe_name,
            r.description AS recipe_description,
            ucr.crafted_at
        FROM UserCraftedRecipes ucr
        JOIN Recipes r ON r.id = ucr.recipe_id
        WHERE ucr.user_id = ?
        ORDER BY ucr.crafted_at DESC
    `;

    const VALUES = [data.user_id];

    pool.query(SQL, VALUES, callback);
};

