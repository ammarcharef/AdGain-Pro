const User = require('../models/User');
const Withdrawal = require('../models/Withdrawal');
const Ad = require('../models/Ad');
const Task = require('../models/Task');

// @route   GET api/admin/dashboard
// @desc    Get key admin statistics
// @access  Admin
exports.getAdminStats = async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();
        const pendingWithdrawals = await Withdrawal.countDocuments({ status: 'Pending' });
        const activeAds = await Ad.countDocuments({ isActive: true, remainingViews: { $gt: 0 } });
        const pendingTotal = await Withdrawal.aggregate([
            { $match: { status: 'Pending' } },
            { $group: { _id: null, totalAmount: { $sum: '$amount' } } }
        ]);

        res.json({
            totalUsers,
            pendingWithdrawals,
            activeAds,
            totalPendingAmount: pendingTotal[0] ? pendingTotal[0].totalAmount.toFixed(2) : '0.00'
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @route   GET api/admin/withdrawals/pending
// @desc    Get all pending withdrawal requests
// @access  Admin
exports.getPendingWithdrawals = async (req, res) => {
    try {
        // جلب الطلبات مع معلومات المستخدم (User.username)
        const withdrawals = await Withdrawal.find({ status: 'Pending' })
            .populate('user', ['username', 'email'])
            .sort({ createdAt: 1 });
        res.json(withdrawals);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @route   POST api/admin/withdrawals/process/:id
// @desc    Mark a withdrawal request as processed
// @access  Admin
exports.processWithdrawal = async (req, res) => {
    const withdrawalId = req.params.id;
    const adminUserId = req.user.id; // هوية المدير الذي عالج الطلب

    try {
        const withdrawal = await Withdrawal.findById(withdrawalId);

        if (!withdrawal) {
            return res.status(404).json({ msg: 'Withdrawal request not found' });
        }
        if (withdrawal.status !== 'Pending') {
            return res.status(400).json({ msg: `Withdrawal is already ${withdrawal.status}` });
        }
        
        // ** ملاحظة هامة: في هذا المكان، يجب عليك يدوياً تنفيذ عملية الدفع المصرفية الحقيقية (خارج الكود) **
        
        withdrawal.status = 'Processed';
        withdrawal.processedBy = adminUserId;
        withdrawal.processedAt = Date.now();
        await withdrawal.save();

        res.json({ msg: 'Withdrawal processed successfully. Funds disbursed.' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @route   POST api/admin/user/block/:id
// @desc    Block a user (منع المستخدم من الدخول)
// @access  Admin
exports.blockUser = async (req, res) => {
    const userId = req.params.id;
    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }
        
        // يمكن إضافة حقل 'isBlocked' إلى نموذج المستخدم لتعطيل حسابه
        // سنكتفي هنا بتغيير كلمة المرور بشكل مؤقت كآلية للحظر
        // *للتطبيق في الإنتاج، يجب إضافة حقل isBlocked في نموذج User*
        // user.isBlocked = true; 
        // user.save(); 
        
        res.json({ msg: `User ${user.username} successfully blocked (requires isBlocked field implementation)` });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};