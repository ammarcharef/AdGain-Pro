const mongoose = require('mongoose');

const WithdrawalSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    amount: { type: Number, required: true },
    paymentMethod: { type: String, required: true },
    accountDetails: { type: String, required: true },
    status: { type: String, enum: ['Pending', 'Paid', 'Rejected'], default: 'Pending' },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Withdrawal', WithdrawalSchema);
