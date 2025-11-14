const mongoose = require('mongoose');

const AdSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    url: {
        type: String,
        required: true
    },
    rewardAmount: { // الأجر المعلوم الذي يتقاضاه المستخدم
        type: Number,
        required: true,
        min: 0.01 
    },
    viewDuration: {
        type: Number,
        required: true, // المدة اللازمة للمشاهدة بالثواني
        min: 5
    },
    totalViews: { // إجمالي عدد المشاهدات المشتراة
        type: Number,
        required: true
    },
    remainingViews: { // المشاهدات المتبقية (يتم خصمها)
        type: Number
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });

// يتم تعيين remainingViews كـ totalViews عند الإنشاء
AdSchema.pre('save', function(next) {
    if (this.isNew) {
        this.remainingViews = this.totalViews;
    }
    next();
});

module.exports = mongoose.model('Ad', AdSchema);