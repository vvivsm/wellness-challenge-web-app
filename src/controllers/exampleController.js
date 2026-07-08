module.exports.preTokenGenerate = (req, res, next) => {
    res.locals.userId = req.body.id;
    next();
}

module.exports.beforeSendToken = (req, res, next) => {
    res.locals.message = `Token is generated.`;
    next();
}

module.exports.showTokenVerified = (req, res, next) => {
    res.status(200).json({
        userId: res.locals.userId,
        message: "Token is verified."
    });
}

module.exports.showCompareSuccess = (req, res, next) => {
    res.status(200).json({
        message: "Compare is successful."
    });
}

module.exports.preCompare = (req, res, next) => {
    res.locals.hash = req.body.hash;
    next();
}

module.exports.showHashing = (req, res, next) => {
    res.status(200).json({
        hash: res.locals.hash,
        message: `Hash is successful.`
    });
}
