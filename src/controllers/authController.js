//////////////////////////////////////////////////////
// REQUIRE MODULES
//////////////////////////////////////////////////////
const model = require('../models/authModel');

// Check Username or Email Exist
module.exports.checkUsernameOrEmailExist = (req, res, next) => {

    // 400 Check for all expected input 
    if (req.body.username == undefined ||
        req.body.email == undefined ||
        req.body.password == undefined) {
        return res.status(400).json({ message: "Username, email or password is missing." });
    }

    // We only need username & email for checking if exist (not password)
    const data = {
        username: req.body.username,
        email: req.body.email
    };


    const callback = (error, results) => {

        if (error) {
            console.log(error);
            return res.status(500).json({ message: "Internal server error" });
        }

        else {

            // If results.length > 0, username or email was found in one or more users.
            if (results.length > 0) {
                return res.status(409).json({ message: "Username or email already exists" });
            }

            // No issues found, moving on.
            else next();
        }
    };

    model.checkUsernameOrEmailExist(data, callback);
};

// Register User (Create)
module.exports.register = (req, res, next) => {

    // 400 Skipped as we've already done it in the check earlier

    // Prepare the data for the model
    // We use hash here, not the raw password
    const data = {
        username: req.body.username,
        email: req.body.email,
        password: res.locals.hash //Encrypted in hashPassword
    };

    const callback = (error, results) => {

        if (error) {
            console.log(error);
            return res.status(500).json({ message: "Internal server error" });
        }

        else {
            //For sendToken: They send res.locals message & token
            res.locals.message = `User ${data.username} created successfully.`;

            //For generateToken: They save res.locals.userId into token payload
            res.locals.userId = results.insertId;
            next();
        }
    };

    model.insertUser(data, callback);
};

// Login
// This retrieves related User data by username for comparing later
module.exports.login = (req, res, next) => {

    // 400 Check for all expected input 
    if (req.body.username == undefined ||
        req.body.password == undefined) {
        return res.status(400).json({ message: "Username or password is missing." });
    }

    // We only need username to get all the User data first
    const data = {
        username: req.body.username
    };


    const callback = (error, results) => {

        if (error) {
            console.log(error);
            return res.status(500).json({ message: "Internal server error" });
        }

        else {

            // If results.length == 0, that means no such user was found.
            if (results.length == 0) {
                return res.status(404).json({ message: "User not found" });
            }

            else {
                // For comparePassword: hashed password is saved into res.locals.hash
                res.locals.hash = results[0].password;
                // For generateToken: Matching userId for input username is saved. 
                res.locals.userId = results[0].id;

                next();
            }
        }
    };

    model.selectUserByUsername(data, callback);
};