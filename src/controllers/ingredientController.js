// Name: Vivian Tan Xiu Li
// StudentID: 2518268
// Class: DAAA/FT/1B/06

const model = require('../models/ingredientModel');

module.exports.readAllIngredients = (req, res, next) => {
    const callback = (error, results, fields) => {
        if (error) {
            console.error(error);
            return res.status(500).json({ message: "Internal Server Error" });
        }


        if (results.length === 0) {
            return res.status(404).json({ message: "Ingredients not found." });
        }

        res.locals.data = results;
        next();
    }

    model.selectAll(callback);
};

module.exports.readIngredientById = (req, res, next) => {
    const data = { ingredient_id: req.params.ingredient_id };

    const callback = (error, results) => {
        if (error) {
            console.error(error);
            return res.status(500).json({ message: "Internal server error" });
        }
        if (results.length === 0) {
            return res.status(404).json({ message: "Ingredient not found" });
        }

        res.locals.data = results[0]; 
        next();
    };

    model.selectById(data, callback);
};