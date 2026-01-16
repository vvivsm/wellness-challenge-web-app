// Name: Vivian Tan Xiu Li
// StudentID: 2518268
// Class: DAAA/FT/1B/06

const express = require("express");
const router = express.Router();
const recipeController = require("../controllers/recipeController");
const { attachMessage, sendResponse } = require("../middleware/response");

//Get all recipes
router.get('/',
    recipeController.readAllRecipes,
    attachMessage("Recipes retrieved successfully", 200),
    sendResponse()
);

//get recipes by its id
router.get('/:recipe_id/requirements',
    recipeController.readRecipeRequirementsById,
    attachMessage("Recipe requirements retrieved successfully", 200),
    sendResponse()
);


module.exports = router;
