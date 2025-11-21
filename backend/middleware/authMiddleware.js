const jwt = require('jsonwebtoken');

module.exports = function (req, res, next) {
    // التوكن يأتي من Authorization header (لواجهة الويب)
    const token = req.header('Authorization');

    if (!token) {
        return res.status(401).json({ msg: 'لا يوجد توكن، الوصول مرفوض' });
    }

    try {
        const tokenClean = token.replace('Bearer ', '');
        const decoded = jwt.verify(tokenClean, process.env.JWT_SECRET);
        req.user = decoded.user;
        next();
    } catch (err) {
        res.status(401).json({ msg: 'التوكن غير صالح' });
    }
};