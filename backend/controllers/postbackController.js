const User = require('../models/User');

const EXCHANGE_RATE = 200; 
const USER_SHARE_PERCENTAGE = 0.70; 

exports.handlePostback = async (req, res) => {
    // ... (منطق استقبال الأرباح وتوزيعها)
    try {
        const { userid, amount_usd, trans_id, status } = req.query;
        // ... (منطق التحقق من status=2 للإلغاء)
        
        const userReward = (parseFloat(amount_usd) * EXCHANGE_RATE) * USER_SHARE_PERCENTAGE; 
        const user = await User.findOne({ telegramId: userid });

        if (user) {
            user.balance += userReward;
            // ... (تسجيل المعاملة)
            await user.save();
            res.status(200).send('OK'); 
        } else {
            res.status(404).send('User not found');
        }

    } catch (error) {
        console.error('Postback Fatal Error:', error.message);
        res.status(500).send('Error');
    }
};