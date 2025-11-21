const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./db');

dotenv.config();
connectDB();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Routes (المسارات الأساسية للنظام MERN)
app.use('/api/auth', require('./routes/auth'));
app.use('/api/earn', require('./routes/earn')); // مسار جلب الأرباح

// مسار صحي لإبقاء الخادم حياً
app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'API running successfully' });
});

app.get('/', (req, res) => {
    res.send('AdGain v2 API is Running...');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server started on port ${PORT}`));