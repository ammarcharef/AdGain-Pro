const User = require('../models/User');
const bcrypt = require('bcryptjs'); 

// @route   GET api/user/dashboard
// @desc    Get user profile and balance
// @access  Private
exports.getDashboard = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        if (!user) { return res.status(404).json({ msg: 'User not found' }); }
        
        // هنا يمكن إضافة حسابات الـ XP أو أي إحصائيات أخرى
        
        res.json({
            username: user.username,
            email: user.email,
            balance: user.balance.toFixed(2),
            // نمرر تفاصيل الدفع لتبسيط واجهة السحب
            paymentMethod: user.paymentMethod,
            paymentAccount: user.paymentAccount
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @route   PUT api/user/
// @desc    Update user profile details, payment info, or set withdrawal password
// @access  Private
exports.updateProfile = async (req, res) => {
    const userId = req.user.id;
    const { paymentMethod, paymentAccount, newWithdrawalPass } = req.body; 

    try {
        const user = await User.findById(userId);
        if (!user) { return res.status(404).json({ msg: 'User not found' }); }

        const updateFields = {};

        // تحديث تفاصيل الدفع
        if (paymentMethod) updateFields.paymentMethod = paymentMethod;
        if (paymentAccount) updateFields.paymentAccount = paymentAccount;

        // تحديث كلمة مرور السحب وتشفيرها
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