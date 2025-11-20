const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    username: { type: String, unique: true },
    telegramId: { type: String, required: true, unique: true }, // حاسم لربط البوت
    firstName: { type: String },
    balance: { type: Number, default: 0 },
    xp: { type: Number, default: 0 },
    level: { type: Number, default: 1 },
    referralCode: { type: String, unique: true },
    referredBy: { type: String, default: null },
    withdrawalAccount: { type: String, default: null }, 
    isAdmin: { type: Boolean, default: false }, // صلاحية المدير (يتم تعديلها يدوياً)
    joinedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', UserSchema);
