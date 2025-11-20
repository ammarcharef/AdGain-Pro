const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./db'); 

// 1. تشغيل البوتات (يجب أن يكون لكل منهما توكن مختلف)
const userBot = require('./userBot'); // بوت المستخدمين
const adminBot = require('./adminBot'); // بوت الإدارة

dotenv.config(); 
connectDB(); 

const app = express();
app.use(cors());
app.use(express.json()); 

// مسار صحي للبقاء على قيد الحياة (Health Check)
app.get('/', (req, res) => {
    res.status(200).send('✅ AdGain Pro Bot System is Active & Running.');
});

const PORT = process.env.PORT || 10000; 
app.listen(PORT, () => console.log(`🚀 Server started on port ${PORT}`));
