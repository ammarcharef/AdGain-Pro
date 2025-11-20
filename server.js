const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./db'); 

// 1. استيراد البوتات ككائنات (Objects)
const userBot = require('./userBot'); 
const adminBot = require('./adminBot'); 

dotenv.config(); 
connectDB(); 

const app = express();
app.use(cors());
app.use(express.json()); 

// **************************************************
// 2. إعداد Webhooks (الخطوة الحاسمة للاستقرار)
// **************************************************

const WEBHOOK_URL = process.env.WEBHOOK_URL; // مثال: https://adgain-pro-t07e.onrender.com

if (WEBHOOK_URL) {
    // A. تعيين مسار Webhook لبوت المستخدمين
    userBot.setWebHook(WEBHOOK_URL + '/user_updates');
    
    // B. تعيين مسار Webhook لبوت المدير
    adminBot.setWebHook(WEBHOOK_URL + '/admin_updates');

    // C. جعل الخادم يستمع للرسائل القادمة من تليجرام (POST requests)
    app.post('/user_updates', (req, res) => {
        userBot.processUpdate(req.body); // تمرير التحديث إلى بوت المستخدمين
        res.sendStatus(200); // يجب الرد بـ 200 فوراً لتجنب التكرار
    });

    app.post('/admin_updates', (req, res) => {
        adminBot.processUpdate(req.body); // تمرير التحديث إلى بوت المدير
        res.sendStatus(200);
    });
} else {
    console.warn("⚠️ WEBHOOK_URL غير مُعين. البوت يعمل بوضعية Polling (غير مستقرة).");
}

// ... (بقية منطق Express)

app.get('/', (req, res) => {
    res.status(200).send('✅ AdGain Pro System is Active & Running.');
});

const PORT = process.env.PORT || 10000; 
app.listen(PORT, () => console.log(`🚀 Server started on port ${PORT}`));
