const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    username: { type: String, unique: true }, // نحفظ فيه معرف تليجرام Tg_12345
    telegramId: { type: String, required: true, unique: true }, // المعرف الرقمي الصافي
    firstName: { type: String },
    balance: { type: Number, default: 0 },
    xp: { type: Number, default: 0 },
    level: { type: Number, default: 1 },
    referralCode: { type: String, unique: true },
    referredBy: { type: String, default: null },
    withdrawalAccount: { type: String, default: null }, // آخر حساب سحب تم استخدامه
    joinedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', UserSchema);
