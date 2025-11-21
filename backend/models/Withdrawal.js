const mongoose = require('mongoose');

const WithdrawalSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    amount: { type: Number, required: true, min: 500 },
    paymentMethod: { type: String, enum: ['CCP', 'BANK', 'PAYPAL', 'PAYEER'], required: true },
    accountDetails: { type: String, required: true },
    status: { type: String, enum: ['Pending', 'Paid', 'Rejected'], default: 'Pending' },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Withdrawal', WithdrawalSchema);