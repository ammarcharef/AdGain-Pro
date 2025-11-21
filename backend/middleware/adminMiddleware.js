const User = require('../models/User');

module.exports = async function (req, res, next) {
    try {
        // نستخدم req.user.id الذي تم فك ترميزه من authMiddleware
        const user = await User.findById(req.user.id); 

        // التحقق من أن المستخدم موجود ولديه صلاحية المدير
        if (!user || user.isAdmin !== true) {
            return res.status(403).json({ msg: 'Access denied: Requires Admin privileges' });
        }
        next();
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};