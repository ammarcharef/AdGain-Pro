const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./db'); 

// --- تشغيل البوتات ---
// 1. بوت المستخدمين (واجهة العمل)
require('./userBot'); 
// 2. بوت الإدارة (واجهة التحكم وتوزيع المال)
require('./adminBot'); 

dotenv.config(); 
connectDB(); 

const app = express();

// (بقية إعدادات الـ Server والـ Postback تبقى كما هي...)
app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(express.json()); 

// مسار استلام الأرباح من الشركات (Postback)
const User = require('./models/User');
const USER_SHARE = 0.70; // نسبة المستخدم

app.get('/api/postback/:network', async (req, res) => {
    // ... (نفس كود الـ Postback الذي كتبناه سابقاً) ...
});

app.get('/', (req, res) => {
    res.send('🚀 AdGain Pro System (User Bot + Admin Bot) is Running!');
});

const PORT = process.env.PORT || 10000; 
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
