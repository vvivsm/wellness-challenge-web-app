const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const userIngredientController = require("../controllers/userIngredientController");
const ingredientController = require('../controllers/ingredientController');
const craftController = require("../controllers/craftController");
const userCraftedRecipeController = require("../controllers/userCraftedRecipeController");
const jwtMiddleware = require("../middleware/jwtMiddleware")
const { validateBody } = require('../middleware/request');
const { attachMessage, sendResponse } = require('../middleware/response');

router.post('/ingredients/:ingredient_id/buy',
    jwtMiddleware.verifyToken,
    ingredientController.readIngredientById,
    userIngredientController.buyIngredient,
    userIngredientController.addIngredientToInventory,
    userIngredientController.readInventoryByUser,
    attachMessage("Ingredient purchased successfully", 200),
    sendResponse()
);

router.get('/inventory',
    jwtMiddleware.verifyToken,
    userIngredientController.readInventoryByUser,
    attachMessage("Inventory retrieved successfully", 200),
    sendResponse()
);

router.delete('/inventory/:ingredient_id',
    jwtMiddleware.verifyToken,
    userIngredientController.sellOneIngredient,
    attachMessage("Ingredient sold successfully", 200),
    sendResponse()
);

router.post('/recipes/:recipe_id/craft',
    jwtMiddleware.verifyToken,
    craftController.requireRecipeExists,
    userCraftedRecipeController.checkNotCraftedBefore,
    craftController.loadRequirements,
    craftController.checkInventoryEnough,
    craftController.deductIngredients,
    craftController.insertCraftedRecipe,
    attachMessage("Recipe crafted successfully", 201),
    sendResponse()
);

router.get('/crafted',
    jwtMiddleware.verifyToken,
    userCraftedRecipeController.readCraftedByUser,
    attachMessage("Crafted recipes retrieved successfully", 200),
    sendResponse()
);

router.get('/',
    jwtMiddleware.verifyToken,
    userController.readUserById,
    sendResponse()
)

router.put('/',
    jwtMiddleware.verifyToken,
    userController.requireUniqueUsername,
    userController.updateUserById,
    userController.readUserById,
    attachMessage("User updated successfully", 200),
    sendResponse()
);

module.exports = router;
