const User = require('../models/User');
const Withdrawal = require('../models/Withdrawal');
const Ad = require('../models/Ad');

exports.getAdminStats = async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();
        const pendingWithdrawals = await Withdrawal.countDocuments({ status: 'Pending' });
        const activeAds = await Ad.countDocuments({ isActive: true });
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

exports.getPendingWithdrawals = async (req, res) => {
    try {
        const withdrawals = await Withdrawal.find({ status: 'Pending' })
            .populate('user', ['username', 'email'])
            .sort({ createdAt: 1 });
        res.json(withdrawals);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

exports.processWithdrawal = async (req, res) => {
    const withdrawalId = req.params.id;
    try {
        const withdrawal = await Withdrawal.findById(withdrawalId);
        if (!withdrawal || withdrawal.status !== 'Pending') {
            return res.status(400).json({ msg: 'الطلب غير موجود أو معالج مسبقاً.' });
        }
        
        withdrawal.status = 'Paid';
        withdrawal.processedAt = Date.now();
        await withdrawal.save();

        res.json({ msg: 'تم تسجيل الدفع بنجاح.' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};