const model = require('../models/userModel');

//Q1 
module.exports.createUser = (req, res, next) => {
    const data = {
        username: req.body.username
    };

    const callback = (error, results) => {
        if (error) {
            console.error(error);
            return res.status(500).json({ message: "Internal server error" });
        }

        res.locals.userId = results.insertId;
        next();
    };

    model.insertNew(data, callback);
};

//Q1, Q3, Q4, Q9
module.exports.readUserById = (req, res, next) => {
    const data = {
        id: res.locals.userId
    };

    const callback = (error, results) => {
        if (error) {
            console.error(error);
            return res.status(500).json({ message: "Internal server error" });
        }

        if (results.length === 0) {
            return res.status(404).json({ message: "User not found" });
        }

        res.locals.data = results[0];
        next();
    };

    model.selectById(data, callback);
};

//Q1, Q4
module.exports.requireUniqueUsername = (req, res, next) => {
    const newUsername = req.body.username;

    if (!newUsername) {
        return res.status(400).json({ message: "Missing required data" });
    }

    const data = {
        username: newUsername,
        user_id: res.locals.userId
    };

    const callback = (error, results) => {
        if (error) {
            console.error("requireUniqueUsername error:", error);
            return res.status(500).json({ message: "Internal server error" });
        }

        if (results.length !== 0) {
            return res.status(409).json({ message: "Username taken" });
        }

        next();
    };

    model.selectByUsernameExcludingUser(data, callback);
};

//Q2
module.exports.readAllUser = (req, res, next) => {
    const callback = (error, results, fields) => {
        if (error) {
            console.error(error);
            return res.status(500).json({ message: "Internal Server Error" });
        }


        if (results.length === 0) {
            return res.status(404).json({ message: "Users not found." });
        }

        res.locals.data = results;
        next();
    }

    model.selectAll(callback);
};

//Q4
module.exports.updateUserById = (req, res, next) => {
    const data = {
        id: res.locals.userId,
        username: req.body.username
    };

    const callback = (error, results) => {
        if (error) {
            console.error(error);
            return res.status(500).json({ message: "Internal server error" });
        }

        if (results.affectedRows === 0) {
            return res.status(404).json({ message: "User not found" });
        }

        res.locals.userId = data.id;
        next();
    };

    model.updateById(data, callback);
};

//Q9
module.exports.rewardCompletionById = (req, res, next) => {
    const userIdFromToken = res.locals.userId;

    if (userIdFromToken === undefined || req.params.id === undefined) {
        return res.status(400).json({ message: "Missing required data" });
    }

    const data = {
        user_id: userIdFromToken,
        challenge_id: req.params.id
    };
    const callback = (error, results) => {
        if (error) {
            console.error(error);
            return res.status(500).json({ message: "Internal server error" });
        }
        next();
    };

    model.addPoints(data, callback);
};