const mongoose = require('mongoose');

const WithdrawalSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    amount: {
        type: Number,
        required: true,
        min: 10
    },
    accountDetails: { // لضمان تسجيل الحساب الذي تم السحب عليه
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['Pending', 'Processed', 'Rejected'],
        default: 'Pending'
    },
    processedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null // يجب أن يكون حساب المالك أو المدير
    },
    processedAt: {
        type: Date
    }
}, { timestamps: true });

module.exports = mongoose.model('Withdrawal', WithdrawalSchema);