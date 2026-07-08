const express = require('express');

const router = express.Router();

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
module.exports = router;
