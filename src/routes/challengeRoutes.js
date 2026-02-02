// Name: Vivian Tan Xiu Li
// StudentID: 2518268
// Class: DAAA/FT/1B/06

const express = require('express');
const router = express.Router();
const challengeController = require('../controllers/challengeController');
const userController = require('../controllers/userController');
const completionController = require('../controllers/completionController');
const jwtMiddleware = require("../middleware/jwtMiddleware")
const { validateBody } = require('../middleware/request');
const { attachMessage, sendResponse } = require('../middleware/response');

//Q5
router.post('/',
    validateBody('user_id', 'description', 'points', 'type'),
    challengeController.createChallenge,
    challengeController.readChallengeById,
    attachMessage("Challenge created successfully", 201),
    sendResponse()
);

//Q6
router.get('/',
    challengeController.readAllChallenge,
    sendResponse()
);

//Q10
router.get('/:id',
    challengeController.readChallengeById,
    sendResponse()
)

//Q7
router.delete('/:id',
    challengeController.deleteChallengeById,
    challengeController.deleteCompletedChallengeById,
    sendResponse()
);

//Q8
router.put('/:id',
    validateBody('user_id', 'description', 'points', 'type'),
    challengeController.requireMatchingCreatorId,
    challengeController.updateChallengeById,
    challengeController.readChallengeById,
    attachMessage("Challenge updated successfully", 200),
    sendResponse()
);

//Q9
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