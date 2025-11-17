const User = require('../models/User');
const Withdrawal = require('../models/Withdrawal');

const MIN_WITHDRAWAL_AMOUNT = 500.00; 

exports.requestWithdrawal = async (req, res) => {
    // يجب أن تكون هذه الحقول متوفرة في جسم الطلب من الواجهة الأمامية
    const { amount, paymentMethod, paymentAccount } = req.body; 
    const userId = req.user.id;

    try {
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }
        
        // 1. التحقق من تفاصيل الحساب (يمكن تخزينها مؤقتاً في الطلب)
        if (!paymentAccount || !paymentMethod) {
            return res.status(400).json({ msg: 'Payment details are required.' });
        }

        // 2. التحقق من الحد الأدنى والرصيد
        if (amount < MIN_WITHDRAWAL_AMOUNT) {
            return res.status(400).json({ msg: `Minimum withdrawal amount is ${MIN_WITHDRAWAL_AMOUNT.toFixed(2)} DZD.` });
        }
        if (user.balance < amount) {
            return res.status(400).json({ msg: 'Insufficient balance for this withdrawal amount.' });
        }

        // 3. تحديث حساب المستخدم بمعلومات الدفع الأخيرة
        user.paymentMethod = paymentMethod;
        user.paymentAccount = paymentAccount;

        // 4. إنشاء طلب سحب وخصم المبلغ
        const withdrawal = new Withdrawal({
            user: userId,
            amount,
            paymentMethod: user.paymentMethod,
            accountDetails: user.paymentAccount,
            status: 'Pending'
        });
        
        await withdrawal.save();
        
        user.balance -= amount;
        await user.save();

        res.json({ 
            msg: 'Withdrawal request submitted successfully. It will be processed within 48 hours.',
            newBalance: user.balance.toFixed(2)
        });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};