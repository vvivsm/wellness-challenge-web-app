module.exports.validateBody = (...fields) => (req, res, next) => {
    if (!req.body || typeof req.body !== 'object') {
        return res.status(400).json({ message: "Invalid request body" });
    }

    const missing = fields.filter(field => req.body[field] === undefined);

    if (missing.length > 0) {
        return res.status(400).json({ message: `Missing required fields: ${missing.join(", ")}` });
    }

    next();
};
