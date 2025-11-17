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
    rewardAmount: { 
        type: Number,
        required: true,
        min: 0.01 
    },
    viewDuration: {
        type: Number,
        required: true,
        min: 5
    },
    totalViews: { 
        type: Number,
        required: true
    },
    remainingViews: { 
        type: Number
    },
    isActive: {
        type: Boolean,
        default: true
    },
    // ربط الإعلان بالمعلن الذي قام بإنشائه (ميزة المعلنين)
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Advertiser', 
        required: false 
    }
}, { timestamps: true });

AdSchema.pre('save', function(next) {
    if (this.isNew) {
        this.remainingViews = this.totalViews;
    }
    next();
});

module.exports = mongoose.model('Ad', AdSchema);