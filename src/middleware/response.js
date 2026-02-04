// Name: Vivian Tan Xiu Li
// StudentID: 2518268
// Class: DAAA/FT/1B/06

// Middleware to attach a message and HTTP status code
// Store message in res.locals so it can be accessed later
// Store HTTP status code in res.locals
module.exports.attachMessage = (message, status) => (req, res, next) => {
    res.locals.message = message;
    res.locals.status = status;
    next();
}

// Middleware to send the final HTTP response
// Use status from res.locals, or default to 200 OK
// Use message from res.locals, or default message
// Use data from res.locals, or null if none provided
module.exports.sendResponse = () =>(req,res) => {
    const status = res.locals.status || 200;
    const message = res.locals.message || "Success";
    const data = res.locals.data || null;

    res.status(status).json({message, data})
}
