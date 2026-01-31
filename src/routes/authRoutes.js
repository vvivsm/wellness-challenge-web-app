//////////////////////////////////////////////////////
// REQUIRE MODULES
//////////////////////////////////////////////////////
const express = require('express');

//////////////////////////////////////////////////////
// CREATE ROUTER
//////////////////////////////////////////////////////
const router = express.Router();

//////////////////////////////////////////////////////
// DEFINE ROUTES
//////////////////////////////////////////////////////
const exampleController = require('../controllers/exampleController');
const authController = require('../controllers/authController');
const bcryptMiddleware = require('../middleware/bcryptMiddleware');
const jwtMiddleware = require('../middleware/jwtMiddleware');

router.post("/login", authController.login, bcryptMiddleware.comparePassword, jwtMiddleware.generateToken, jwtMiddleware.sendToken);
router.post("/register", authController.checkUsernameOrEmailExist, bcryptMiddleware.hashPassword, authController.register, jwtMiddleware.generateToken, jwtMiddleware.sendToken);

router.post("/jwt/generate", exampleController.preTokenGenerate, jwtMiddleware.generateToken, exampleController.beforeSendToken, jwtMiddleware.sendToken);
router.get("/jwt/verify", jwtMiddleware.verifyToken, exampleController.showTokenVerified);
router.post("/bcrypt/compare", exampleController.preCompare, bcryptMiddleware.comparePassword, exampleController.showCompareSuccess);
router.post("/bcrypt/hash", bcryptMiddleware.hashPassword, exampleController.showHashing);
//////////////////////////////////////////////////////
// EXPORT ROUTER
//////////////////////////////////////////////////////
module.exports = router;