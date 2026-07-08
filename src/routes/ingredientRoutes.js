const express = require('express');
const router = express.Router();
const ingredientController = require('../controllers/ingredientController');
const { attachMessage, sendResponse } = require('../middleware/response');

router.get('/',
    ingredientController.readAllIngredients,
    attachMessage("Ingredients retrieved successfully", 200),
    sendResponse()
);

router.get('/:ingredient_id',
    ingredientController.readIngredientById,
    sendResponse()
);

module.exports = router;
