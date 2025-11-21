const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.register = async (req, res) => {
    // ... (منطق التسجيل كما هو) ...
    const { username, email, password, withdrawalAccount } = req.body;
    try {
        let user = await User.findOne({ email });
        if (user) { return res.status(400).json({ msg: 'البريد الإلكتروني مسجل مسبقاً' }); }

        user = new User({ username, email, password, withdrawalAccount });
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);
        await user.save();

        const payload = { user: { id: user.id } };
        jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' }, (err, token) => {
            if (err) throw err;
            res.json({ token, user: { id: user.id, username: user.username, email: user.email, isAdmin: user.isAdmin } });
        });
    } catch (err) { console.error(err.message); res.status(500).send('Server error'); }
};

exports.login = async (req, res) => {
    // ... (منطق الدخول كما هو) ...
    const { email, password } = req.body;
    try {
        let user = await User.findOne({ email });
        if (!user) { return res.status(400).json({ msg: 'بيانات الاعتماد غير صحيحة' }); }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) { return res.status(400).json({ msg: 'بيانات الاعتماد غير صحيحة' }); }

        const payload = { user: { id: user.id } };
        jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' }, (err, token) => {
            if (err) throw err;
            res.json({ token, user: { id: user.id, username: user.username, email: user.email, isAdmin: user.isAdmin, balance: user.balance } });
        });
    } catch (err) { console.error(err.message); res.status(500).send('Server error'); }
};

exports.getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        res.json(user);
    } catch (err) { console.error(err.message); res.status(500).send('Server Error'); }
};