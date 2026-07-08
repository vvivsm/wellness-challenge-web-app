const express = require('express');
const router = express.Router();

const userRoutes = require('./userRoutes');
const challengeRoutes = require('./challengeRoutes');
const ingredientRoutes = require('./ingredientRoutes');
const recipeRoutes = require('./recipeRoutes');
const authRoutes= require('./authRoutes')

router.use('/me', userRoutes);
router.use('/challenges', challengeRoutes);
router.use('/ingredients', ingredientRoutes);
router.use('/recipes', recipeRoutes);
router.use('/auth', authRoutes);

module.exports = router;
