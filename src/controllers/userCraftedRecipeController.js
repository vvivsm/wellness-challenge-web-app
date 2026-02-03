// controllers/userCraftedRecipeController.js
const userCraftedRecipeModel = require("../models/userCraftedRecipeModel");

// Middleware: prevent crafting same recipe more than once
module.exports.checkNotCraftedBefore = (req, res, next) => {
    const tokenUserId = res.locals.userId;
    const paramUserId = res.locals.userId;
    const recipeId = req.params.recipe_id;

    if (!tokenUserId || !paramUserId || !recipeId) {
        return res.status(400).json({ message: "Missing required data" });
    }

    // Security: user must match token
    if (parseInt(paramUserId) !== parseInt(tokenUserId)) {
        return res.status(401).json({ message: "User mismatch" });
    }

    const data = {
        user_id: tokenUserId,
        recipe_id: recipeId
    };

    const callback = (error, results) => {
        if (error) {
            console.error("checkNotCraftedBefore error:", error);
            return res.status(500).json({ message: "Internal server error" });
        }

        // If already crafted, block
        if (results && results.length > 0) {
            return res.status(409).json({ message: "Recipe already crafted" });
        }

        next();
    };

    userCraftedRecipeModel.selectUserCrafted(data, callback);
};

// GET list of crafted recipes for UI
module.exports.readCraftedByUser = (req, res, next) => {
    const tokenUserId = res.locals.userId;
    const paramUserId = res.locals.userId;

    if (!tokenUserId || !paramUserId) {
        return res.status(400).json({ message: "Missing required data" });
    }

    if (parseInt(paramUserId) !== parseInt(tokenUserId)) {
        return res.status(401).json({ message: "User mismatch" });
    }

    const data = { user_id: tokenUserId };

    const callback = (error, results) => {
        if (error) {
            console.error("readCraftedByUser error:", error);
            return res.status(500).json({ message: "Internal server error" });
        }

        res.locals.data = results;
        next();
    };

    userCraftedRecipeModel.selectCraftedByUser(data, callback);
};
