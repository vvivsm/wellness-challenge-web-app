module.exports.validateBody = (...fields) => (req, res, next) => {
    // Check request body
    if (!req.body || typeof req.body !== 'object') {
        return res.status(400).json({ message: "Invalid request body" });
    }

    // Check missing fields
    const missing = fields.filter(field => req.body[field] === undefined);
    
    // fields = array of required field names
    // If req.body[field] is undefined, the field is missing
    if (missing.length > 0) {
        return res.status(400).json({ message: `Missing required fields: ${missing.join(", ")}` });
    }

    next();
};