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
    link: {
        type: String,
        required: true
    },
    reward: {
        type: Number, // المبلغ الذي يكسبه المستخدم
        required: true
    },
    type: {
        type: String,
        enum: ['ad', 'survey', 'app'], // نوع المهمة
        default: 'ad'
    },
    isActive: {
        type: Boolean,
        default: true
    }
});

module.exports = mongoose.model('Task', TaskSchema);