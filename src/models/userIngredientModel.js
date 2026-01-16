// Name: Vivian Tan Xiu Li
// StudentID: 2518268
// Class: DAAA/FT/1B/06

const pool = require("../services/db");

module.exports.addOrIncrement = (data, callback) => {
    const SQLSTATEMENT = `
        UPDATE UserIngredients
        SET quantity = quantity + 1
        WHERE user_id = ? AND ingredient_id = ?;
    `;
    pool.query(SQLSTATEMENT, [data.user_id, data.ingredient_id], callback);
};

module.exports.insertNew = (data, callback) => {
    const SQLSTATEMENT = `
        INSERT INTO UserIngredients (user_id, ingredient_id, quantity)
        VALUES (?, ?, 1);
    `;
    pool.query(SQLSTATEMENT, [data.user_id, data.ingredient_id], callback);
};

module.exports.selectInventoryByUser = (data, callback) => {
    const SQLSTATEMENT = `
        SELECT
            ui.ingredient_id,   -- ID of the ingredient
            i.name,             -- Ingredient name 
            i.cost,             -- Cost of the ingredient
            i.type,             -- Ingredient category/type
            ui.quantity         -- Quantity owned by the user
        FROM UserIngredients ui
        JOIN Ingredients i ON i.id = ui.ingredient_id
        WHERE ui.user_id = ?
        ORDER BY i.cost, i.name;
    `;
    pool.query(SQLSTATEMENT, [data.user_id], callback);
};

module.exports.selectQtyForUser = (data, callback) => {
    const SQLSTATEMENT = `
        SELECT ingredient_id, quantity
        FROM UserIngredients
        WHERE user_id = ?;
    `;
    pool.query(SQLSTATEMENT, [data.user_id], callback);
};

module.exports.deductQty = (data, callback) => {
    const SQLSTATEMENT = `
        UPDATE UserIngredients
        SET quantity = quantity - ?
        WHERE user_id = ? AND ingredient_id = ? AND quantity >= ?;
    `;
    const VALUES = [data.deduct_qty, data.user_id, data.ingredient_id, data.deduct_qty];
    pool.query(SQLSTATEMENT, VALUES, callback);
};