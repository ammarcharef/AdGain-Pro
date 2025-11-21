const jwt = require('jsonwebtoken');

module.exports = function (req, res, next) {
    const token = req.header('x-auth-token');

    if (!token) {
        return res.status(401).json({ msg: 'Access denied. No token provided.' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        if (decoded.advertiser && decoded.advertiser.id) {
            req.advertiser = decoded.advertiser;
            next();
        } else {
            res.status(401).json({ msg: 'Invalid token or not an advertiser token.' });
        }
    } catch (err) {
        res.status(401).json({ msg: 'Token is not valid or expired.' });
    }
};