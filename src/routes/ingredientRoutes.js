// Name: Vivian Tan Xiu Li
// StudentID: 2518268
// Class: DAAA/FT/1B/06

const express = require('express');
const router = express.Router();
const ingredientController = require('../controllers/ingredientController');
const { attachMessage, sendResponse } = require('../middleware/response');

//Get all ingredients
router.get('/',
    ingredientController.readAllIngredients,
    attachMessage("Ingredients retrieved successfully", 200),
    sendResponse()
);

//Get ingredient by ingredient_id
router.get('/:ingredient_id',
    ingredientController.readIngredientById,
    sendResponse()
);

module.exports = router;