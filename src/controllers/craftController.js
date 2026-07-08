const userModel = require("../models/userModel");
const recipeModel = require("../models/recipeModel");
const userIngredientModel = require("../models/userIngredientModel");
const userCraftedRecipeModel = require("../models/userCraftedRecipeModel");


// 404 if user not found
module.exports.requireUserExists = (req, res, next) => {
    const data = { id: req.params.id };

    const callback = (error, results) => {
        if (error) {
            console.error(error);
            return res.status(500).json({ message: "Internal server error" });
        }
        if (results.length === 0) {
            return res.status(404).json({ message: "User not found" });
        }
        res.locals.user = results[0];
        next();
    };

    userModel.selectById(data, callback);
};

// 404 if recipe not found
module.exports.requireRecipeExists = (req, res, next) => {
    const data = { recipe_id: req.params.recipe_id };

    const callback = (error, results) => {
        if (error) {
            console.error(error);
            return res.status(500).json({ message: "Internal server error" });
        }
        if (results.length === 0) {
            return res.status(404).json({ message: "Recipe not found" });
        }
        res.locals.recipe = results[0];
        next();
    };

    recipeModel.selectById(data, callback);
};

// load requirements for recipe
module.exports.loadRequirements = (req, res, next) => {
    const data = { recipe_id: req.params.recipe_id };

    const callback = (error, results) => {
        if (error) {
            console.error(error);
            return res.status(500).json({ message: "Internal server error" });
        }
        if (results.length === 0) {
            return res.status(404).json({ message: "Recipe requirements not found" });
        }

        res.locals.requirements = results; // [{ingredient_id, required_qty}, ...]
        next();
    };

    recipeModel.selectRequirementsForCrafting(data, callback);
};

// check inventory is sufficient 
module.exports.checkInventoryEnough = (req, res, next) => {
    const data = { user_id: res.locals.userId };

    const callback = (error, results) => {
        if (error) {
            console.error(error);
            return res.status(500).json({ message: "Internal server error" });
        }

        // Create a map to store user's ingredient quantities
        // Key   = ingredient_id
        // Value = quantity owned by user
        const qtyMap = {};

        // Loop through each ingredient required for the recipe
        for (const row of results) {
            qtyMap[row.ingredient_id] = row.quantity;
        }

        // Loop through each ingredient required for the recipe
        for (const reqItem of res.locals.requirements) {

            // Get quantity user has for this ingredient
            // Default to 0 if ingredient does not exist in inventory
            const have = qtyMap[reqItem.ingredient_id] || 0;

            if (have < reqItem.required_qty) {
                return res.status(403).json({ message: "Not enough ingredients" });
            }
        }

        next();
    };

    userIngredientModel.selectQtyForUser(data, callback);
};

// deduct ingredients one-by-one
module.exports.deductIngredients = (req, res, next) => {
    const requirements = res.locals.requirements;
    const user_id = res.locals.userId;

    // Index to track which ingredient we are currently deducting
    let index = 0;

    // Recursive function to deduct ingredients sequentially
    const deductNext = () => {

        // Base case: all ingredients have been deducted
        // Move on to the next middleware
        if (index >= requirements.length) return next();

        // Get the current required ingredient
        const item = requirements[index];
        const data = {
            user_id: user_id,
            ingredient_id: item.ingredient_id,
            deduct_qty: item.required_qty
        };

        const callback = (error, results) => {
            if (error) {
                console.error(error);
                return res.status(500).json({ message: "Internal server error" });
            }

            // safety: if something changed between check and deduct
            if (results.affectedRows === 0) {
                return res.status(403).json({ message: "Not enough ingredients" });
            }
            // Move to the next ingredient
            index++;
            deductNext();
        };

        userIngredientModel.deductQty(data, callback);
    };

    deductNext();
};

// insert crafted record
module.exports.insertCraftedRecipe = (req, res, next) => {
    const data = {
        user_id: res.locals.userId,
        recipe_id: req.params.recipe_id
    };

    const callback = (error, results) => {
        if (error) {
            console.error(error);
            return res.status(500).json({ message: "Internal server error" });
        }

        res.locals.data = {
            crafted_id: results.insertId,
            user_id: Number(res.locals.userId),
            recipe_id: Number(req.params.recipe_id),
            recipe_name: res.locals.recipe.name
        };

        next();
    };

    userCraftedRecipeModel.insertCrafted(data, callback);
};