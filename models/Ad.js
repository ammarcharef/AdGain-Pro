const mongoose = require('mongoose');

const AdSchema = new mongoose.Schema({
    title: { type: String, required: true },
    url: { type: String, required: true },
    rewardAmount: { type: Number, required: true },
    totalViews: { type: Number, required: true },
    remainingViews: { type: Number, required: true },
    isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Ad', AdSchema);
