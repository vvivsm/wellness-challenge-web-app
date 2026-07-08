const model = require('../models/authModel');

module.exports.checkUsernameOrEmailExist = (req, res, next) => {

    if (req.body.username == undefined ||
        req.body.email == undefined ||
        req.body.password == undefined) {
        return res.status(400).json({ message: "Username, email or password is missing." });
    }

    const data = {
        username: req.body.username,
        email: req.body.email
    };

    const callback = (error, results) => {

        if (error) {
            console.error(error);
            return res.status(500).json({ message: "Internal server error" });
        }

        else {

            if (results.length > 0) {
                return res.status(409).json({ message: "Username or email already exists" });
            }

            else next();
        }
    };

    model.checkUsernameOrEmailExist(data, callback);
};

module.exports.register = (req, res, next) => {

    const data = {
        username: req.body.username,
        email: req.body.email,
        password: res.locals.hash
    };

    const callback = (error, results) => {

        if (error) {
            console.error(error);
            return res.status(500).json({ message: "Internal server error" });
        }

        else {
            res.locals.message = `User ${data.username} created successfully.`;
            res.locals.userId = results.insertId;
            next();
        }
    };

    model.insertUser(data, callback);
};

module.exports.login = (req, res, next) => {

    if (req.body.username == undefined ||
        req.body.password == undefined) {
        return res.status(400).json({ message: "Username or password is missing." });
    }

    const data = {
        username: req.body.username
    };

    const callback = (error, results) => {

        if (error) {
            console.error(error);
            return res.status(500).json({ message: "Internal server error" });
        }

        else {

            if (results.length == 0) {
                return res.status(404).json({ message: "User not found" });
            }

            else {
                res.locals.hash = results[0].password;
                res.locals.userId = results[0].id;

                next();
            }
        }
    };

    model.selectUserByUsername(data, callback);
};
