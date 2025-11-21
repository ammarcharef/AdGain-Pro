const mongoose = require('mongoose');

const TaskSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String },
    instructionUrl: { type: String, required: true },
    rewardAmount: { type: Number, required: true },
    remainingCompletions: { type: Number, required: true },
    isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Task', TaskSchema);
