const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./db'); 

dotenv.config(); 
connectDB(); 

const app = express();
app.use(cors());
app.use(express.json()); 

// تشغيل بوت المستخدمين وبوت الإدارة عبر إرسال التوكنات من Render
// يجب أن يكون لديك توكنان مختلفان في إعدادات Render
const userBot = require('./userBot'); 
const adminBot = require('./adminBot'); 

// ... (بقية منطق Express)

app.get('/', (req, res) => {
    res.status(200).send('✅ AdGain Pro System is Active & Running.');
});

const PORT = process.env.PORT || 10000; 
app.listen(PORT, () => console.log(`🚀 Server started on port ${PORT}`));
