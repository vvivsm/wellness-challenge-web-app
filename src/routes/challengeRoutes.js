const express = require('express');
const router = express.Router();
const challengeController = require('../controllers/challengeController');
const userController = require('../controllers/userController');
const completionController = require('../controllers/completionController');
const jwtMiddleware = require("../middleware/jwtMiddleware")
const { validateBody } = require('../middleware/request');
const { attachMessage, sendResponse } = require('../middleware/response');

router.post('/',
    validateBody('description', 'points', 'type'),
    jwtMiddleware.verifyToken,
    challengeController.createChallenge,
    challengeController.readChallengeById,
    attachMessage("Challenge created successfully", 201),
    sendResponse()
);

router.get('/',
    challengeController.readAllChallenge,
    sendResponse()
);

router.post('/:id',
    jwtMiddleware.verifyToken,
    challengeController.readChallengeById,
    completionController.createCompletion,
    userController.rewardCompletionById,
    completionController.readCompletionById,
    attachMessage("Challenge completed!", 201),
    sendResponse()
);

module.exports = router;
