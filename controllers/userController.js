const User = require('../models/User');
const bcrypt = require('bcryptjs'); 

exports.getDashboard = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        if (!user) { return res.status(404).json({ msg: 'User not found' }); }
        
        const nextLevelXP = 100 * Math.pow(user.level, 1.5);
        
        res.json({
            // ... (بقية البيانات)
            balance: user.balance.toFixed(2),
            level: user.level,
            xp: user.xp,
            nextLevelXP: nextLevelXP,
            paymentMethod: user.paymentMethod,
            paymentAccount: user.paymentAccount
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// دالة تحديث الملف الشخصي وتعيين كلمة مرور السحب
exports.updateProfile = async (req, res) => {
    const userId = req.user.id;
    const { paymentMethod, paymentAccount, newWithdrawalPass } = req.body; 

    try {
        const user = await User.findById(userId);
        if (!user) { return res.status(404).json({ msg: 'User not found' }); }

        const updateFields = {};

        if (paymentMethod) updateFields.paymentMethod = paymentMethod;
        if (paymentAccount) updateFields.paymentAccount = paymentAccount;

        if (newWithdrawalPass) {
            const salt = await bcrypt.genSalt(10);
            updateFields.withdrawalPassword = await bcrypt.hash(newWithdrawalPass, salt);
        }

        const updatedUser = await User.findByIdAndUpdate(
            userId, 
            { $set: updateFields },
            { new: true } 
        ).select('-password -withdrawalPassword');

        res.json({ msg: 'تم تحديث ملفك الشخصي بنجاح.', user: updatedUser });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};