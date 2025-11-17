const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    password: {
        type: String,
        required: true
    },
    balance: {
        type: Number,
        default: 0,
        min: 0
    },
    withdrawalAccount: { // رقم حساب السحب (CCP/Bank) للتحقق الأمني
        type: String,
        required: true, 
        unique: true, 
        trim: true
    },
    referralCode: {
        type: String,
        unique: true
    },
    referredBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    level: {
        type: Number,
        default: 1
    },
    xp: {
        type: Number,
        default: 0
    },
    lastDailyCheckIn: {
        type: Date,
        default: null
    },
    isAdmin: {
        type: Boolean,
        default: false
    },
    // الحقول الجديدة لنظام السحب (يجب أن يحددها المستخدم قبل السحب)
    paymentMethod: {
        type: String,
        enum: ['CCP', 'BANK', 'PAYPAL', 'PAYEER'],
        default: 'CCP' 
    },
    paymentAccount: { // رقم الحساب أو الإيميل الفعلي الذي سيتم الدفع عليه
        type: String,
    },
}, { timestamps: true });

UserSchema.methods.levelUp = function() {
    const nextLevelXP = 100 * Math.pow(this.level, 1.5);
    if (this.xp >= nextLevelXP) {
        this.level += 1;
        this.xp -= nextLevelXP; 
        console.log(`User ${this.username} leveled up to ${this.level}`);
        return true;
    }
    return false;
};

UserSchema.pre('save', function(next) {
    if (this.isModified('xp') && this.xp > 0) {
        this.levelUp();
    }
    if (!this.referralCode) {
        this.referralCode = this.username.toLowerCase().slice(0, 5) + Math.random().toString(36).substring(2, 7);
    }
    next();
});

module.exports = mongoose.model('User', UserSchema);