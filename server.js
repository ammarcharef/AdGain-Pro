const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./db'); 

// 1. تحميل متغيرات البيئة (MONGO_URI, JWT_SECRET, CORS_ORIGIN)
dotenv.config(); 

// 2. الاتصال بقاعدة البيانات
connectDB(); 

const app = express();

// 3. Middlewares (البرامج الوسيطة)
// حل مشكلة CORS: يستخدم متغير البيئة للسماح بالوصول من نطاق Firebase
app.use(cors({
    origin: process.env.CORS_ORIGIN, 
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
}));
app.use(express.json()); // يسمح بقراءة بيانات JSON

// 4. استيراد المسارات (Routes) - تم تجميع كل الاستيرادات هنا
const authRoutes = require('./routes/auth');
const adRoutes = require('./routes/ads');
const userRoutes = require('./routes/user');
const taskRoutes = require('./routes/tasks');
const dailyRoutes = require('./routes/daily');
const adminRoutes = require('./routes/admin'); // الاستيراد مرة واحدة
const advertiserRoutes = require('./routes/advertiser'); // الاستيراد مرة واحدة

// 5. استخدام المسارات (Apply Routes) - تم تجميع كل التعيينات هنا
app.use('/api/auth', authRoutes);
app.use('/api/ads', adRoutes);
app.use('/api/user', userRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/daily', dailyRoutes);
app.use('/api/admin', adminRoutes);  // تعيين مسار المدير
app.use('/api/advertiser', advertiserRoutes); // تعيين مسار المعلن

// 6. مسار الجذر
app.get('/', (req, res) => {
    res.send('AdGain Pro API is running.');
});

// 7. تشغيل الخادم
// يستخدم البورت الذي يوفره نظام الاستضافة (Render)
const PORT = process.env.PORT || 10000; // استخدم 10000 أو 5000 كبديل محلي

app.listen(PORT, () => console.log(`Server started on port ${PORT}`));