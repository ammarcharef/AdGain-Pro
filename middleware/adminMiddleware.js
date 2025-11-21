const User = require('../models/User');

module.exports = async function (req, res, next) {
    try {
        const user = await User.findById(req.user.id);

        // يجب تعريف حقل 'isAdmin: true' في قاعدة البيانات لحساب المدير
        // يُفترض أنك ستقوم بتعيين هذا الحقل يدوياً في MongoDB لحسابك
        if (!user || !user.isAdmin) {
            return res.status(403).json({ msg: 'Access denied: Requires Admin privileges' });
        }
        next();
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};