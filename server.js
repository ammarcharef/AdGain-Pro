const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
// تأكد من وجود ملف db.js الذي يحتوي على دالة connectDB()
const connectDB = require('./db'); 

// تأكد من تثبيت الحزم المطلوبة: npm install express cors dotenv mongoose jsonwebtoken bcryptjs

dotenv.config();
connectDB(); // الاتصال بقاعدة البيانات

const app = express();

// Middlewares
app.use(cors()); // السماح بالاتصال من الواجهة الأمامية (Firebase Hosting)
app.use(express.json()); // السماح بتحليل بيانات JSON المرسلة في الطلبات

// Import Routes (جميع مسارات النظام)
const authRoutes = require('./routes/auth');
const adRoutes = require('./routes/ads');
const userRoutes = require('./routes/user');
const taskRoutes = require('./routes/tasks');
const dailyRoutes = require('./routes/daily');
const adminRoutes = require('./routes/admin'); 

// Use Routes
app.use('/api/auth', authRoutes);
app.use('/api/ads', adRoutes);
app.use('/api/user', userRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/daily', dailyRoutes);
app.use('/api/admin', adminRoutes); 

// Root Route
app.get('/', (req, res) => {
    res.send('AdGain Pro API is running.');
});

// هذا هو التعديل الهام: استخدام البورت الذي يوفره نظام الاستضافة
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server started on port ${PORT}`));