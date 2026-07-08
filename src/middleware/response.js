module.exports.attachMessage = (message, status) => (req, res, next) => {
    res.locals.message = message;
    res.locals.status = status;
    next();
}

module.exports.sendResponse = () =>(req,res) => {
    const status = res.locals.status || 200;
    const message = res.locals.message || "Success";
    const data = res.locals.data || null;

    res.status(status).json({message, data})
}
