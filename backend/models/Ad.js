const mongoose = require('mongoose');

const AdSchema = new mongoose.Schema({
    title: { type: String, required: true },
    url: { type: String, required: true },
    rewardAmount: { type: Number, required: true, min: 0.01 },
    viewDuration: { type: Number, required: true },
    totalViews: { type: Number, required: true },
    remainingViews: { type: Number, required: true },
    isActive: { type: Boolean, default: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Advertiser', required: false }
});

AdSchema.pre('save', function(next) {
    if (this.isNew && this.remainingViews === undefined) { this.remainingViews = this.totalViews; }
    next();
});
module.exports = mongoose.model('Ad', AdSchema);