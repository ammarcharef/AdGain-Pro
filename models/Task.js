const mongoose = require('mongoose');

const TaskSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    // نوع المهمة: SURVEY, APP_INSTALL, SOCIAL_SHARE
    taskType: { 
        type: String,
        enum: ['SURVEY', 'APP_INSTALL', 'SOCIAL_SHARE', 'CLICK'],
        required: true
    },
    rewardAmount: { // الأجر المعلوم بالدينار الجزائري
        type: Number,
        required: true,
        min: 1
    },
    rewardXP: { // نقاط الخبرة المكتسبة
        type: Number,
        required: true,
        min: 1
    },
    instructionUrl: { // رابط خارجي لإكمال المهمة
        type: String,
        required: true
    },
    // يجب على المعلن تعيين هذا المبلغ لتغطية المكافآت (للمالك)
    totalBudget: {
        type: Number,
        required: true
    },
    remainingCompletions: {
        type: Number
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });

TaskSchema.pre('save', function(next) {
    if (this.isNew) {
        this.remainingCompletions = this.totalBudget / this.rewardAmount;
    }
    next();
});

module.exports = mongoose.model('Task', TaskSchema);