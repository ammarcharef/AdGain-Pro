const Task = require('../models/Task');
const User = require('../models/User');

// جلب جميع المهام المتاحة
exports.getTasks = async (req, res) => {
    try {
        const tasks = await Task.find({ isActive: true });
        res.json(tasks);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// تنفيذ المهمة واستلام الجائزة
exports.claimReward = async (req, res) => {
    const taskId = req.params.id;
    const userId = req.user.id; // يأتي من التوكن

    try {
        const task = await Task.findById(taskId);
        if (!task) {
            return res.status(404).json({ msg: 'المهمة غير موجودة' });
        }

        // هنا يجب إضافة منطق التحقق من أن المستخدم لم يقم بإكمالها مسبقاً

        // تحديث رصيد المستخدم
        const user = await User.findById(userId);
        user.balance += task.reward;
        await user.save();

        res.json({ 
            msg: 'تمت إضافة المكافأة بنجاح', 
            newBalance: user.balance,
            reward: task.reward
        });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};