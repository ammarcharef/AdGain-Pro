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
    withdrawalAccount: { // يُستخدم كآلية أمان لمنع الاحتيال
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
    // نظام المستويات والخبرة (XP)
    level: {
        type: Number,
        default: 1
    },
    xp: {
        type: Number,
        default: 0
    },
    // المكافآت اليومية
    lastDailyCheckIn: {
        type: Date,
        default: null
    },
    // صلاحية الإدارة (لتحديد حساب المالك)
    isAdmin: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

// منطق المستويات (حساب XP المطلوبة للمستوى التالي)
UserSchema.methods.levelUp = function() {
    // XP المطلوبة للمستوى التالي: 100 * (المستوى الحالي)^1.5
    const nextLevelXP = 100 * Math.pow(this.level, 1.5);
    if (this.xp >= nextLevelXP) {
        this.level += 1;
        // الاحتفاظ بالـ XP المتبقية بعد رفع المستوى
        this.xp -= nextLevelXP; 
        console.log(`User ${this.username} leveled up to ${this.level}`);
        return true;
    }
    return false;
};

UserSchema.pre('save', function(next) {
    if (this.isModified('xp') && this.xp > 0) {
        this.levelUp(); // التحقق من رفع المستوى عند تعديل XP
    }
    if (!this.referralCode) {
        // إنشاء رمز إحالة تلقائي
        this.referralCode = this.username.toLowerCase().slice(0, 5) + Math.random().toString(36).substring(2, 7);
    }
    next();
});

module.exports = mongoose.model('User', UserSchema);