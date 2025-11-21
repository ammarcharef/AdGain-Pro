const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./db'); 

// 1. تشغيل البوتات (يجب أن يكون لكل منهما توكن مختلف)
const userBot = require('./userBot'); 
const adminBot = require(process.env.ADMIN_BOT_PATH || './adminBot'); // Path conditional

dotenv.config(); 
connectDB(); 

const app = express();
app.use(cors());
app.use(express.json()); 

// Routes (للوصول عبر الويب - Auth and Earn)
app.use('/api/auth', require('./routes/auth'));
app.use('/api/earn', require('./routes/earn'));
app.use('/api/admin', require('./routes/admin'));

// مسار صحي للبقاء على قيد الحياة
app.get('/', (req, res) => {
    res.status(200).send('✅ AdGain Pro System is Active.');
});

const PORT = process.env.PORT || 5000; 
app.listen(PORT, () => console.log(`🚀 Server started on port ${PORT}`));