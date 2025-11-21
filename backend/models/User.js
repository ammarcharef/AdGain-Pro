const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    balance: { type: Number, default: 0.00 },
    // لتتبع أرباح المستخدم من الشركات
    totalEarned: { type: Number, default: 0.00 },
    // سجل المعاملات القادمة من الشركات
    transactions: [{
        network: String, // اسم الشركة (Monlix, CPX)
        amount: Number,  // المبلغ الذي كسبه المستخدم
        transactionId: String, // رقم المعاملة من الشركة لمنع التكرار
        date: { type: Date, default: Date.now }
    }],
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', UserSchema);