const model = require("../models/recipeModel");

module.exports.readAllRecipes = (req, res, next) => {
    const callback = (error, results) => {
        if (error) {
            console.error(error);
            return res.status(500).json({ message: "Internal server error" });
        }

        res.locals.data = results;
        next();
    };

    model.selectAll(callback);
};

module.exports.readRecipeRequirementsById = (req, res, next) => {
    if (req.params.recipe_id === undefined) {
        return res.status(400).json({ message: "Missing required data" });
    }

    const data = {
        recipe_id: req.params.recipe_id
    };

    const callback = (error, results) => {
        if (error) {
            console.error(error);
            return res.status(500).json({ message: "Internal server error" });
        }

        if (results.length === 0) {
            return res.status(404).json({ message: "Recipe requirements not found" });
        }

        res.locals.data = results;
        next();
    };

    model.selectRequirementsForDisplay(data, callback);
};
