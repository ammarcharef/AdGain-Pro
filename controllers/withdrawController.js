const User = require('../models/User');
const Withdrawal = require('../models/Withdrawal');
const bcrypt = require('bcryptjs'); 

const MIN_WITHDRAWAL_AMOUNT = 500.00; 

exports.requestWithdrawal = async (req, res) => {
    const { amount, withdrawalPass } = req.body;
    const userId = req.user.id;

    try {
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }
        
        // 1. التحقق من الأمان (كلمة مرور السحب)
        if (!user.withdrawalPassword) {
             return res.status(400).json({ msg: 'يرجى تعيين كلمة مرور السحب أولاً في إعدادات حسابك.' });
        }
        
        const isPassMatch = await bcrypt.compare(withdrawalPass, user.withdrawalPassword);
        if (!isPassMatch) {
            return res.status(400).json({ msg: 'كلمة مرور السحب غير صحيحة.' });
        }

        // 2. التحقق من معلومات الدفع المسجلة
        if (!user.paymentAccount || !user.paymentMethod) {
            return res.status(400).json({ msg: 'تفاصيل الدفع غير مسجلة في ملفك الشخصي. يرجى التحديث.' });
        }
        
        // 3. التحقق من الصحة (حل خطأ المبلغ)
        const withdrawalAmount = parseFloat(amount); 
        
        if (isNaN(withdrawalAmount) || withdrawalAmount < MIN_WITHDRAWAL_AMOUNT) {
            return res.status(400).json({ msg: `الرجاء إدخال مبلغ صحيح لا يقل عن ${MIN_WITHDRAWAL_AMOUNT.toFixed(2)} د.ج.` });
        }

        if (user.balance < withdrawalAmount) {
            return res.status(400).json({ msg: 'الرصيد غير كافٍ لإجراء هذا السحب.' });
        }

        // 4. إنشاء طلب سحب وخصم المبلغ
        const withdrawal = new Withdrawal({
            user: userId,
            amount: withdrawalAmount,
            paymentMethod: user.paymentMethod,
            accountDetails: user.paymentAccount, 
            status: 'Pending'
        });
        
        await withdrawal.save();
        
        user.balance -= withdrawalAmount;
        await user.save();

        res.json({ 
            msg: 'تم تسجيل طلب السحب بنجاح. سيتم المعالجة خلال 48 ساعة.',
            newBalance: user.balance.toFixed(2)
        });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};