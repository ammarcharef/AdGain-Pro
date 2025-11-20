const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./db'); 

// 1. استيراد البوتات ككائنات (هذا يضمن أن الكود يستطيع الوصول إليها في الدالة POST)
// يجب أن يكون userBot.js و adminBot.js يصدران البوت كـ module.exports = bot;
const userBotInstance = require('./userBot'); 
const adminBotInstance = require('./adminBot'); 

dotenv.config(); 
connectDB(); 

const app = express();
app.use(cors());
app.use(express.json()); 

const WEBHOOK_URL = process.env.WEBHOOK_URL; 

if (WEBHOOK_URL) {
    // 2. إعداد Webhook
    userBotInstance.setWebHook(WEBHOOK_URL + '/user_updates');
    adminBotInstance.setWebHook(WEBHOOK_URL + '/admin_updates');

    // 3. مسار معالجة التحديثات للمستخدمين
    app.post('/user_updates', (req, res) => {
        userBotInstance.processUpdate(req.body); 
        res.sendStatus(200); 
    });

    // 4. مسار معالجة التحديثات للمدير
    app.post('/admin_updates', (req, res) => {
        adminBotInstance.processUpdate(req.body); 
        res.sendStatus(200);
    });
} else {
    console.warn("⚠️ WEBHOOK_URL غير مُعين. البوت يعمل بوضعية Polling (غير مستقرة).");
}

// 5. مسار Express الرئيسي
app.get('/', (req, res) => {
    res.status(200).send('✅ AdGain Pro System is Active & Running.');
});

const PORT = process.env.PORT || 10000; 
app.listen(PORT, () => console.log(`🚀 Server started on port ${PORT}`));
