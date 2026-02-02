// Name: Vivian Tan Xiu Li
// StudentID: 2518268
// Class: DAAA/FT/1B/06

const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const userIngredientController = require("../controllers/userIngredientController");
const ingredientController = require('../controllers/ingredientController');
const craftController = require("../controllers/craftController");
const jwtMiddleware = require("../middleware/jwtMiddleware")
const { validateBody } = require('../middleware/request');
const { attachMessage, sendResponse } = require('../middleware/response');

//Q1
router.post('/',
    validateBody('username'),
    userController.requireUniqueUsername,
    userController.createUser,
    userController.readUserById,
    attachMessage("User created successfully", 201),
    sendResponse()
);

//Q2
router.get('/',
    userController.readAllUser,
    sendResponse()
);

//Q3
router.get('/:user_id',
    userController.readUserById,
    sendResponse()
)

//Q4
router.put('/:user_id',
    userController.requireUniqueUsername,
    userController.updateUserById,
    userController.readUserById,
    attachMessage("User updated successfully", 200),
    sendResponse()
);

//Deducts points, adds ingredient to inventory
//Buy ingredient
router.post('/ingredients/:ingredient_id/buy',
    jwtMiddleware.verifyToken,
    ingredientController.readIngredientById,
    userIngredientController.buyIngredient,
    userIngredientController.addIngredientToInventory,
    userIngredientController.readInventoryByUser,
    attachMessage("Ingredient purchased successfully", 200),
    sendResponse()
);

//Get inventory of a user
router.get('/inventory',
    jwtMiddleware.verifyToken,
    userIngredientController.readInventoryByUser,
    attachMessage("Inventory retrieved successfully", 200),
    sendResponse()
);

//Craft a recipe
router.post('/recipes/:recipe_id/craft',
    jwtMiddleware.verifyToken,
    craftController.requireRecipeExists,
    craftController.loadRequirements,
    craftController.checkInventoryEnough,
    craftController.deductIngredients,
    craftController.insertCraftedRecipe,
    attachMessage("Recipe crafted successfully", 201),
    sendResponse()
);

module.exports = router;