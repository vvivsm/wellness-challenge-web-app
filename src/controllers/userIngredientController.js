const userModel = require("../models/userModel");
const userIngredientModel = require("../models/userIngredientModel");

module.exports.buyIngredient = (req, res, next) => {

    const userId = res.locals.userId;
    const ingredient = res.locals.ingredient;

    if (userId === undefined || !ingredient || ingredient.cost === undefined) {
        return res.status(400).json({ message: "Missing required data" });
    }

    const data = {
        user_id: userId,
        cost: ingredient.cost
    };

    const callback = (error, results) => {
        if (error) {
            console.error(error);
            return res.status(500).json({ message: "Internal server error" });
        }

        if (results.affectedRows === 0) {
            return res.status(403).json({ message: "Insufficient points" });
        }

        next();
    };

    userModel.deductPoints(data, callback);
};


module.exports.addIngredientToInventory = (req, res, next) => {
    const data = {
        user_id: res.locals.userId,
        ingredient_id: req.params.ingredient_id
    };

    const callbackUpdate = (error, results) => {
        if (error) {
            console.error(error);
            return res.status(500).json({ message: "Internal server error" });
        }

        // if updated existing row, done
        if (results.affectedRows > 0) {
            return next();
        }

        // else insert new row
        const callbackInsert = (error2, results2) => {
            if (error2) {
                console.error(error2);
                return res.status(500).json({ message: "Internal server error" });
            }
            next();
        };

        userIngredientModel.insertNew(data, callbackInsert);
    };

    userIngredientModel.addOrIncrement(data, callbackUpdate);
};

module.exports.readInventoryByUser = (req, res, next) => {
    const data = { user_id: res.locals.userId };

    console.log(data);

    const callback = (error, results) => {
        if (error) {
            console.error(error);
            return res.status(500).json({ message: "Internal server error" });
        }

        res.locals.data = results;
        next();
    };

    userIngredientModel.selectInventoryByUser(data, callback);
};

module.exports.sellOneIngredient = (req, res, next) => {
    const userId = res.locals.userId;
    const ingredientId = parseInt(req.params.ingredient_id, 10);

    if (!userId || isNaN(ingredientId)) {
        return res.status(400).json({ message: "Missing required data" });
    }

    const data = {
        user_id: userId,
        ingredient_id: ingredientId
    };

    const callback = (err, result) => {
        if (err) {
            console.error("sellOneIngredient error:", err);

            if (err.code === "NO_INGREDIENT") {
                return res.status(404).json({ message: "Ingredient not found" });
            }
            if (err.code === "NOT_OWNED") {
                return res.status(400).json({ message: "You don't have this ingredient to sell" });
            }

            return res.status(500).json({ message: "Internal server error" });
        }

        res.locals.data = {
            ingredient_id: ingredientId,
            refunded_points: result.refunded_points,
            new_quantity: result.new_quantity
        };

        next();
    };

    userIngredientModel.sellOneIngredient(data, callback);
};