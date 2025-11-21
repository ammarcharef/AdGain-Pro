const jwt = require('jsonwebtoken');

module.exports = function (req, res, next) {
    // جلب الرمز من الـ Header باسم 'x-auth-token'
    const token = req.header('x-auth-token');

    // التحقق من وجود الرمز
    if (!token) {
        return res.status(401).json({ msg: 'Access denied. No token provided.' });
    }

    // التحقق من صلاحية الرمز
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        // إضافة بيانات المستخدم إلى طلب الـ req
        req.user = decoded.user;
        next();
    } catch (err) {
        // فشل التحقق
        res.status(401).json({ msg: 'Token is not valid or expired.' });
    }
};