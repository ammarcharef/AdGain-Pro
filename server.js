const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./db'); 

// تشغيل البوت (العقل المدبر الجديد)
require('./bot'); 

dotenv.config(); 
connectDB(); 

const app = express();

// Middlewares
app.use(cors({
    origin: process.env.CORS_ORIGIN, 
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
}));
app.use(express.json()); 

// Import Routes (فقط للمدير والمعلنين)
const authRoutes = require('./routes/auth'); // نحتاجه لتسجيل دخول المدير فقط
const adminRoutes = require('./routes/admin');
const advertiserRoutes = require('./routes/advertiser');

// Use Routes
app.use('/api/auth', authRoutes); // لتسجيل دخول المدير/المعلن
app.use('/api/admin', adminRoutes); // لوحة التحكم الخاصة بك
app.use('/api/advertiser', advertiserRoutes); // لوحة المعلنين

// مسار الجذر
app.get('/', (req, res) => {
    res.send('AdGain Pro Bot Platform is Running 🤖');
});

const PORT = process.env.PORT || 10000; 

app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
