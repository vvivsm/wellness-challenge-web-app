const pool = require("../services/db");

module.exports.selectAll = (callback) => {
    const SQLSTATEMENT = `
        SELECT * FROM Recipes;
    `;
    pool.query(SQLSTATEMENT, callback);
};

module.exports.selectById = (data, callback) => {
    const SQLSTATEMENT = `
        SELECT * FROM Recipes
        WHERE id = ?;
    `;
    pool.query(SQLSTATEMENT, [data.recipe_id], callback);
};

module.exports.selectRequirementsForCrafting = (data, callback) => {
    const SQLSTATEMENT = `
        SELECT ingredient_id, required_qty
        FROM RecipeRequirements
        WHERE recipe_id = ?;
    `;
    pool.query(SQLSTATEMENT, [data.recipe_id], callback);
};

module.exports.selectRequirementsForDisplay = (data, callback) => {
    const SQLSTATEMENT = `
        SELECT 
            rr.ingredient_id,     -- ID of the required ingredient
            i.name,               -- Ingredient name (for display)
            i.type,               -- Ingredient type 
            i.cost,               -- Cost of the ingredient
            rr.required_qty       -- Quantity required for this recipe
        FROM RecipeRequirements rr
        -- Join Ingredients table to get ingredient details
        JOIN Ingredients i ON i.id = rr.ingredient_id
        WHERE rr.recipe_id = ?
    `;

    pool.query(SQLSTATEMENT, [data.recipe_id], callback);
};
