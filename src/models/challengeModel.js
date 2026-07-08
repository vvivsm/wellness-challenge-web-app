const pool = require('../services/db');

module.exports.insertChallenge = (data, callback) => {
    const SQLSTATEMENT = `
        INSERT INTO Wellnesschallenge (creator_id, description, points, type)
        VALUES (?, ?, ?, ?);
    `;
    const VALUES = [data.creator_id, data.description, data.points, data.type];
    pool.query(SQLSTATEMENT, VALUES, callback);
};

module.exports.selectById = (data, callback) => {
    const SQLSTATEMENT = `
        SELECT * FROM Wellnesschallenge
        WHERE id = ?;
    `;

    const VALUES = [data.id]
    pool.query(SQLSTATEMENT, VALUES, callback);
}

module.exports.selectAll = (callback) => {
    const SQLSTATEMENT = `
        SELECT * FROM Wellnesschallenge;
    `;

    pool.query(SQLSTATEMENT, callback);
}

module.exports.deleteById = (data, callback) => {
    const SQLSTATEMENT = `
        DELETE FROM Wellnesschallenge
        WHERE id = ?;
    `;
    pool.query(SQLSTATEMENT, [data.id], callback);
};

module.exports.deleteCompletionsByChallengeId = (data, callback) => {
    const SQLSTATEMENT = `
        DELETE FROM UserCompletions
        WHERE id = ?;
    `;
    pool.query(SQLSTATEMENT, [data.id], callback);
};

module.exports.updateById = (data, callback) => {
    const SQLSTATEMENT = `
        UPDATE Wellnesschallenge
        SET description = ?, points = ?, type = ?
        WHERE id = ?;
    `;
    const VALUES = [data.description, data.points, data.type, data.id];
    pool.query(SQLSTATEMENT, VALUES, callback);
};
