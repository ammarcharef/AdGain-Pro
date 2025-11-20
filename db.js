const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI);
        console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`❌ MongoDB Error: ${error.message}`);
        process.exit(1); // إيقاف العملية في حال فشل الاتصال الجوهري
    }
};

module.exports = connectDB;
