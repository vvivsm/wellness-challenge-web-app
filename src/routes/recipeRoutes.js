const express = require("express");
const router = express.Router();
const recipeController = require("../controllers/recipeController");
const { attachMessage, sendResponse } = require("../middleware/response");

router.get('/',
    recipeController.readAllRecipes,
    attachMessage("Recipes retrieved successfully", 200),
    sendResponse()
);

router.get('/:recipe_id/requirements',
    recipeController.readRecipeRequirementsById,
    attachMessage("Recipe requirements retrieved successfully", 200),
    sendResponse()
);

module.exports = router;
