// Name: Vivian Tan Xiu Li
// StudentID: 2518268
// Class: DAAA/FT/1B/06

const model = require('../models/completionModel');

//Q9
module.exports.createCompletion = (req, res, next) => {

    const userIdFromToken = res.locals.userId;

    const bodyUserId = req.body ? res.locals.userId : undefined;

    if (userIdFromToken === undefined || req.params.id === undefined || req.body.details === undefined) {
        return res.status(400).json({ message: "Missing required data" });
    }

    if (bodyUserId !== undefined && parseInt(bodyUserId) !== parseInt(userIdFromToken)) {
        return res.status(401).json({ message: "User mismatch" });
    }

    const data = {
        challenge_id: req.params.id,
        user_id: userIdFromToken,
        details: req.body.details
    };

    const callback = (error, results) => {
        if (error) {
            console.error(error);
            return res.status(500).json({ message: "Internal server error" });
        }

        res.locals.completionId = results.insertId;
        next();
    };

    model.insertCompletion(data, callback);
};


//Q9
module.exports.readCompletionById = (req, res, next) => {
    const data = { id: res.locals.completionId };

    const callback = (error, results) => {
        if (error) {
            console.error(error);
            return res.status(500).json({ message: "Internal server error" });
        }

        if (results.length === 0) {
            return res.status(404).json({ message: "Completion not found" });
        }

        res.locals.data = results[0];
        next();
    };

    model.selectById(data, callback);
};