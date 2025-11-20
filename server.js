const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./db'); 

// 1. تحميل الإعدادات
dotenv.config(); 

// 2. الاتصال بقاعدة البيانات
connectDB(); 

// 3. إعداد خادم Express
const app = express();
app.use(cors());
app.use(express.json()); 

// 4. نقطة نهاية للصحة (Health Check) لضمان بقاء الخادم حياً
app.get('/', (req, res) => {
    res.status(200).send('✅ AdGain Pro System is Active & Running.');
});

// 5. تشغيل البوت (Import)
// يتم استدعاؤه هنا ليعمل جنباً إلى جنب مع الخادم
try {
    require('./bot');
    console.log('🤖 Bot Module Loaded Successfully.');
} catch (error) {
    console.error('❌ Failed to load Bot Module:', error);
}

// 6. الاستماع للمنفذ
const PORT = process.env.PORT || 10000; 
app.listen(PORT, () => console.log(`🚀 Server started on port ${PORT}`));
