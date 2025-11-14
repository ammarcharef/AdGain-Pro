const User = require('../models/User');
const Withdrawal = require('../models/Withdrawal');
const MIN_WITHDRAWAL_AMOUNT = 500.00; 

// @route   GET api/user/dashboard
// @desc    Get user profile and balance
// @access  Private
exports.getDashboard = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }
        
        // حساب XP المطلوبة للمستوى التالي
        const nextLevelXP = 100 * Math.pow(user.level, 1.5);
        
        res.json({
            username: user.username,
            email: user.email,
            balance: user.balance.toFixed(2),
            withdrawalAccount: user.withdrawalAccount,
            referralCode: user.referralCode,
            level: user.level,
            xp: user.xp,
            nextLevelXP: nextLevelXP,
            lastDailyCheckIn: user.lastDailyCheckIn
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @route   POST api/user/withdraw
// @desc    Request withdrawal (تسجيل الطلب في جدول منفصل)
// @access  Private
exports.requestWithdrawal = async (req, res) => {
    const { amount } = req.body;
    const userId = req.user.id;
    const withdrawAmount = parseFloat(amount);

    try {
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        if (withdrawAmount < MIN_WITHDRAWAL_AMOUNT) {
            return res.status(400).json({ msg: `Minimum withdrawal is ${MIN_WITHDRAWAL_AMOUNT} DZD` });
        }

        if (user.balance < withdrawAmount) {
            return res.status(400).json({ msg: 'Insufficient balance' });
        }

        // 1. خصم المبلغ من الرصيد
        user.balance -= withdrawAmount;
        await user.save();

        // 2. إنشاء طلب سحب جديد في جدول Withdrawal
        const newWithdrawal = new Withdrawal({
            user: userId,
            amount: withdrawAmount,
            accountDetails: user.withdrawalAccount,
            status: 'Pending'
        });
        await newWithdrawal.save();

        res.json({ 
            msg: `Withdrawal request of ${withdrawAmount} DZD submitted successfully. Status: Pending.`,
            newBalance: user.balance.toFixed(2)
        });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};