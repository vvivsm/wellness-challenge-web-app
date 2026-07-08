// Import express module and create main router object (mini app instance)
const express = require('express');
const router = express.Router();

// Import sub routers
const userRoutes = require('./userRoutes');
const challengeRoutes = require('./challengeRoutes');
const ingredientRoutes = require('./ingredientRoutes');
const recipeRoutes = require('./recipeRoutes');
const authRoutes= require('./authRoutes')

// Mount sub routers to their respective paths
router.use('/me', userRoutes);
router.use('/challenges', challengeRoutes);
router.use('/ingredients', ingredientRoutes);
router.use('/recipes', recipeRoutes);
router.use('/auth', authRoutes);

// Export main router with routes
module.exports = router;
