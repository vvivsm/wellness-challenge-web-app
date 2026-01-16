// Name: Vivian Tan Xiu Li
// StudentID: 2518268
// Class: DAAA/FT/1B/06

// Import express module and create main router object (mini app instance)
const express = require('express');
const router = express.Router();

// Import sub routers
const userRoutes = require('./userRoutes');
const challengeRoutes = require('./challengeRoutes');
const ingredientRoutes = require('./ingredientRoutes');
const recipeRoutes = require('./recipeRoutes');

// Mount sub routers to their respective paths
router.use('/users', userRoutes);
router.use('/challenges', challengeRoutes);
router.use('/ingredients', ingredientRoutes);
router.use('/recipes', recipeRoutes);

// Export main router with routes
module.exports = router;
