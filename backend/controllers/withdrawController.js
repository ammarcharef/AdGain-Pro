const User = require('../models/User');
const Withdrawal = require('../models/Withdrawal');
const bcrypt = require('bcryptjs'); 

const MIN_WITHDRAWAL_AMOUNT = 500.00; 

exports.requestWithdrawal = async (req, res) => {
    const { amount, withdrawalPass } = req.body;
    const userId = req.user.id; 

    try {
        const user = await User.findById(userId);

        // ... (تحقق الأمان وكلمة مرور السحب) ...
        
        // 1. التحقق من الصحة
        const withdrawalAmount = parseFloat(amount); 
        if (isNaN(withdrawalAmount) || withdrawalAmount < MIN_WITHDRAWAL_AMOUNT) {
            return res.status(400).json({ msg: `الرجاء إدخال مبلغ صحيح لا يقل عن ${MIN_WITHDRAWAL_AMOUNT.toFixed(2)} د.ج.` });
        }

        // 2. خصم المبلغ وإنشاء الطلب
        // ... (خصم المبلغ وإنشاء سجل طلب السحب) ...
        
        res.json({ msg: 'تم تسجيل طلب السحب بنجاح.', newBalance: user.balance.toFixed(2) });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};