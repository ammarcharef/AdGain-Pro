const User = require('../models/User');
const moment = require('moment');

const DAILY_REWARD = 50.00; // مكافأة يومية أساسية (50 د.ج)
const DAILY_XP = 10; // نقاط الخبرة اليومية

// @route   POST api/daily/checkin
// @desc    Grant daily reward if 24 hours passed
// @access  Private
exports.dailyCheckIn = async (req, res) => {
    const userId = req.user.id;

    try {
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        const now = moment();
        const lastCheckIn = user.lastDailyCheckIn ? moment(user.lastDailyCheckIn) : null;

        // التحقق من مرور 24 ساعة (أو يوم تقويمي لتبسيط الشريعة)
        // نعتمد على مقارنة التاريخ (اليوم)
        const isToday = lastCheckIn && lastCheckIn.isSame(now, 'day');

        if (isToday) {
            return res.status(400).json({ msg: 'You have already claimed your daily reward today.' });
        }

        // منح المكافأة
        user.balance += DAILY_REWARD;
        user.xp += DAILY_XP;
        user.lastDailyCheckIn = now.toDate();
        
        const levelUp = user.levelUp(); 
        
        await user.save();

        res.json({
            msg: `Daily reward of ${DAILY_REWARD.toFixed(2)} DZD and ${DAILY_XP} XP claimed successfully!`,
            newBalance: user.balance.toFixed(2),
            newXP: user.xp,
            newLevel: user.level,
            levelUp: levelUp
        });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};