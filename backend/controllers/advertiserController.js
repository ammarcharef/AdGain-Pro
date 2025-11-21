const Advertiser = require('../models/Advertiser');
const Ad = require('../models/Ad');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.registerAdvertiser = async (req, res) => {
    const { companyName, email, password } = req.body;
    try {
        // ... (منطق تسجيل المعلن)
        res.status(201).json({ msg: 'Advertiser registered successfully.' });
    } catch (err) { console.error(err.message); res.status(500).send('Server error'); }
};

exports.loginAdvertiser = async (req, res) => {
    // ... (منطق دخول المعلن)
    try {
        // ... (تحقق من الباسوورد)
        const payload = { advertiser: { id: advertiser.id } };
        jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' }, (err, token) => {
            res.json({ token, advertiser: { id: advertiser.id, balance: advertiser.balance } });
        });
    } catch (err) { console.error(err.message); res.status(500).send('Server error'); }
};

exports.createAd = async (req, res) => {
    const { title, url, rewardAmount, viewDuration, totalViews } = req.body;
    const advertiserId = req.advertiser.id;
    const OWNER_PROFIT_MARGIN = 1.2; 
    const totalCost = totalViews * (rewardAmount * OWNER_PROFIT_MARGIN);

    try {
        // ... (منطق إنشاء الإعلان وخصم الرصيد)
        res.status(201).json({ msg: 'Ad campaign created successfully.' });
    } catch (err) { console.error(err.message); res.status(500).send('Server error'); }
};