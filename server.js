const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./db'); 

// --- تشغيل البوتات ---
// نقوم بتشغيل الملفين بشكل منفصل، لأن كل واحد له توكن مختلف الآن
const userBot = require('./userBot'); 
require('./adminBot'); 

dotenv.config(); 
connectDB(); 

const app = express();
app.use(cors());
app.use(express.json()); 

app.get('/', (req, res) => {
    res.send('🚀 AdGain Pro System (User Bot + Admin Bot) is Running!');
});

const PORT = process.env.PORT || 10000; 
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
