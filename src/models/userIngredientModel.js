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

module.exports.sellOneIngredient = (data, callback) => {
    const userId = data.user_id;
    const ingredientId = data.ingredient_id;

    pool.getConnection((connErr, conn) => {
        if (connErr) return callback(connErr);

        conn.beginTransaction((txErr) => {
            if (txErr) {
                conn.release();
                return callback(txErr);
            }

            // 1) Get ingredient cost
            const SQL_COST = `SELECT cost FROM Ingredients WHERE id = ?`;
            conn.query(SQL_COST, [ingredientId], (err1, rows1) => {
                if (err1) return rollback(conn, err1, callback);

                if (!rows1 || rows1.length === 0) {
                    return rollback(conn, { code: "NO_INGREDIENT" }, callback);
                }

                const cost = parseInt(rows1[0].cost, 10) || 0;
                const refund = Math.floor(cost / 2);

                // 2) Check user owns it + get current qty
                const SQL_QTY = `
                    SELECT quantity
                    FROM UserIngredients
                    WHERE user_id = ? AND ingredient_id = ?
                    LIMIT 1
                `;
                conn.query(SQL_QTY, [userId, ingredientId], (err2, rows2) => {
                    if (err2) return rollback(conn, err2, callback);

                    if (!rows2 || rows2.length === 0) {
                        return rollback(conn, { code: "NOT_OWNED" }, callback);
                    }

                    const currentQty = parseInt(rows2[0].quantity, 10) || 0;
                    if (currentQty <= 0) {
                        return rollback(conn, { code: "NOT_OWNED" }, callback);
                    }

                    const newQty = currentQty - 1;

                    // 3) Update qty (if becomes 0, we can delete row)
                    if (newQty === 0) {
                        const SQL_DEL = `
                            DELETE FROM UserIngredients
                            WHERE user_id = ? AND ingredient_id = ?
                        `;
                        conn.query(SQL_DEL, [userId, ingredientId], (err3) => {
                            if (err3) return rollback(conn, err3, callback);
                            updatePoints(conn, userId, refund, newQty, callback);
                        });
                    } else {
                        const SQL_UPD = `
                            UPDATE UserIngredients
                            SET quantity = ?
                            WHERE user_id = ? AND ingredient_id = ?
                        `;
                        conn.query(SQL_UPD, [newQty, userId, ingredientId], (err3) => {
                            if (err3) return rollback(conn, err3, callback);
                            updatePoints(conn, userId, refund, newQty, callback);
                        });
                    }
                });
            });
        });
    });
};

// helpers (still inside same file)
function updatePoints(conn, userId, refund, newQty, callback) {
    const SQL_POINTS = `UPDATE Users SET points = points + ? WHERE id = ?`;
    conn.query(SQL_POINTS, [refund, userId], (err) => {
        if (err) return rollback(conn, err, callback);

        conn.commit((commitErr) => {
            if (commitErr) return rollback(conn, commitErr, callback);

            conn.release();
            callback(null, {
                refunded_points: refund,
                new_quantity: newQty
            });
        });
    });
}

function rollback(conn, err, callback) {
    conn.rollback(() => {
        conn.release();
        callback(err);
    });
}