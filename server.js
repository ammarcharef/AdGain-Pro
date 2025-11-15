const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./db'); 

// 1. تحميل متغيرات البيئة (مثل MONGO_URI و JWT_SECRET و CORS_ORIGIN)
dotenv.config(); 

// 2. الاتصال بقاعدة البيانات
connectDB(); 

const app = express();

// 3. Middlewares (البرامج الوسيطة)
// *****************************************************************
// الحل لمشكلة الاتصال: استخدام متغير البيئة CORS_ORIGIN
app.use(cors({
    origin: process.env.CORS_ORIGIN, // يقرأ 'https://adgainpro.web.app' من Render
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
}));
// *****************************************************************
app.use(express.json()); // يسمح بقراءة بيانات JSON

// 4. استيراد المسارات (Routes)
const authRoutes = require('./routes/auth');
const adRoutes = require('./routes/ads');
const userRoutes = require('./routes/user');
const taskRoutes = require('./routes/tasks');
const dailyRoutes = require('./routes/daily');
const adminRoutes = require('./routes/admin'); 

// 5. استخدام المسارات
app.use('/api/auth', authRoutes);
app.use('/api/ads', adRoutes);
app.use('/api/user', userRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/daily', dailyRoutes);
app.use('/api/admin', adminRoutes); 

// 6. مسار الجذر
app.get('/', (req, res) => {
    res.send('AdGain Pro API is running.');
});

// 7. تشغيل الخادم
// يستخدم البورت الذي يوفره نظام الاستضافة (Render)
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server started on port ${PORT}`));