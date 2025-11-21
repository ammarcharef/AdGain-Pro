const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// @route   POST api/auth/register
// @desc    Register user and link withdrawal account
// @access  Public
exports.registerUser = async (req, res) => {
    const { username, email, password, withdrawalAccount, referralCode } = req.body;

    try {
        // 1. التحقق من وجود المستخدم أو حساب السحب
        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ msg: 'User already exists with this email.' });
        }
        
        // التحقق من أن حساب السحب فريد (لمنع الاحتيال)
        let accountCheck = await User.findOne({ withdrawalAccount });
        if (accountCheck) {
            return res.status(400).json({ msg: 'Withdrawal account is already registered to another user.' });
        }

        // 2. البحث عن المُحيل (إذا وجد)
        let referredBy = null;
        if (referralCode) {
            const referrer = await User.findOne({ referralCode });
            if (referrer) {
                referredBy = referrer._id;
            }
        }

        // 3. إنشاء المستخدم
        user = new User({
            username,
            email,
            password,
            withdrawalAccount,
            referredBy
        });

        // 4. تشفير كلمة المرور
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);

        await user.save();

        // 5. إنشاء رمز الدخول (Token)
        const payload = {
            user: {
                id: user.id
            }
        };

        jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: '5d' }, // 5 أيام صلاحية
            (err, token) => {
                if (err) throw err;
                res.json({ token });
            }
        );
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

// @route   POST api/auth/login
// @desc    Authenticate user & get token
// @access  Public
exports.loginUser = async (req, res) => {
    const { email, password } = req.body;

    try {
        let user = await User.findOne({ email });

        if (!user) {
            return res.status(400).json({ msg: 'Invalid Credentials (Email)' });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(400).json({ msg: 'Invalid Credentials (Password)' });
        }

        const payload = {
            user: {
                id: user.id
            }
        };

        jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: '5d' },
            (err, token) => {
                if (err) throw err;
                res.json({ token });
            }
        );
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};