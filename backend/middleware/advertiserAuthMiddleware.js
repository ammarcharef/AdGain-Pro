const jwt = require('jsonwebtoken');

module.exports = function (req, res, next) {
    const token = req.header('Authorization');

    if (!token) {
        return res.status(401).json({ msg: 'No token, access denied' });
    }

    try {
        const tokenClean = token.replace('Bearer ', '');
        const decoded = jwt.verify(tokenClean, process.env.JWT_SECRET);
        
        // يجب أن نتحقق من أن هذا توكن معلن (Advertiser)
        if (decoded.advertiser && decoded.advertiser.id) {
            req.advertiser = decoded.advertiser;
            next();
        } else {
            return res.status(403).json({ msg: 'Forbidden: Token is not for an advertiser.' });
        }
    } catch (err) {
        res.status(401).json({ msg: 'Token is invalid' });
    }
};