const Task = require('../models/Task');
const User = require('../models/User');

// @route   GET api/tasks/available
// @desc    Get all active microtasks
// @access  Private
exports.getAvailableTasks = async (req, res) => {
    try {
        // تخفيف شروط التصفية مؤقتاً لضمان العرض
        const tasks = await Task.find({ isActive: true, remainingCompletions: { $gt: 0 } }).select('-__v');
        
        if (!Array.isArray(tasks)) {
             console.error('Task query did not return an array');
             return res.json([]);
        }
        
        res.json(tasks);
    } catch (err) {
        console.error("Error in getAvailableTasks:", err.message);
        res.status(500).json({ msg: 'Server error during task fetching.' });
    }
};

// @route   POST api/tasks/complete/:taskId
// @desc    Register a task completion and grant reward (افتراضياً تم التحقق من الإكمال خارجياً)
// @access  Private
exports.completeTask = async (req, res) => {
    const taskId = req.params.taskId;
    const userId = req.user.id;

    try {
        const task = await Task.findById(taskId);
        const user = await User.findById(userId);

        if (!task || task.remainingCompletions <= 0 || !task.isActive) {
            return res.status(404).json({ msg: 'Task not found or completions depleted.' });
        }
        
        // 1. منح المكافأة والـ XP
        user.balance += task.rewardAmount;
        user.xp += task.rewardXP;
        
        // التحقق من رفع المستوى
        const levelUp = user.levelUp(); 

        // 2. تحديث المهمة وخفض عدد الإكمالات المتبقية
        task.remainingCompletions -= 1;
        await task.save();
        
        await user.save();

        res.json({ 
            msg: `Task completed. Reward: ${task.rewardAmount.toFixed(2)} DZD. XP earned: ${task.rewardXP}.`,
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