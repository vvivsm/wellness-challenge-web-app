const model = require('../models/challengeModel');

module.exports.createChallenge = (req, res, next) => {

    const MAX_CHALLENGE_POINTS = 20;

    const points = parseInt(req.body.points, 10);

    if (isNaN(points) || points < 1) {
        return res.status(400).json({
            message: "Points must be at least 1"
        });
    }

    if (points > MAX_CHALLENGE_POINTS) {
        return res.status(400).json({
            message: "Maximum points allowed is " + MAX_CHALLENGE_POINTS
        });
    }
    
    const data = {
        creator_id: res.locals.userId,
        description: req.body.description,
        points: req.body.points,
        type: req.body.type
    };

    const callback = (error, results) => {
        if (error) {
            console.error(error);
            return res.status(500).json({ message: "Internal server error" });
        }

        res.locals.challengeId = results.insertId;
        next();
    };

    model.insertChallenge(data, callback);
};

module.exports.readChallengeById = (req, res, next) => {
    const data = {
        id: req.params.id || res.locals.challengeId
    };

    const callback = (error, results) => {
        if (error) {
            console.error(error);
            return res.status(500).json({ message: "Internal server error" });
        }

        if (results.length === 0) {
            return res.status(404).json({ message: "Challenge not found" });
        }

        res.locals.data = results[0];
        next();
    };

    model.selectById(data, callback);
};

module.exports.readAllChallenge = (req, res, next) => {
    const callback = (error, results, fields) => {
        if (error) {
            console.error(error);
            return res.status(500).json({ message: "Internal Server Error" });
        }

        if (results.length === 0) {
            return res.status(404).json({ message: "Challenges not found." });
        }

        res.locals.data = results;
        next();
    }

    model.selectAll(callback);
};
