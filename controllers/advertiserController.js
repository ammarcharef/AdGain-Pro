const Advertiser = require('../models/Advertiser');
const Ad = require('../models/Ad');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// @route   POST api/advertiser/register
// @desc    Register a new advertiser
// @access  Public
exports.registerAdvertiser = async (req, res) => {
    const { companyName, email, password } = req.body;
    try {
        let advertiser = await Advertiser.findOne({ email });
        if (advertiser) {
            return res.status(400).json({ msg: 'Advertiser email already exists.' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        advertiser = new Advertiser({
            companyName,
            email,
            password: hashedPassword
        });

        await advertiser.save();
        res.status(201).json({ msg: 'Advertiser registered successfully. Please log in.' });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

// @route   POST api/advertiser/login
// @desc    Authenticate and get token
// @access  Public
exports.loginAdvertiser = async (req, res) => {
    const { email, password } = req.body;
    try {
        const advertiser = await Advertiser.findOne({ email });
        if (!advertiser) {
            return res.status(400).json({ msg: 'Invalid Credentials' });
        }
        const isMatch = await bcrypt.compare(password, advertiser.password);
        if (!isMatch) {
            return res.status(400).json({ msg: 'Invalid Credentials' });
        }

        const payload = {
            advertiser: {
                id: advertiser.id
            }
        };

        jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' }, (err, token) => {
            if (err) throw err;
            res.json({ token });
        });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

// @route   POST api/advertiser/create-ad
// @desc    Create a new ad campaign (Advertiser pays per view)
// @access  Private (Advertiser)
exports.createAd = async (req, res) => {
    const { title, url, rewardAmount, viewDuration, totalViews } = req.body;
    const advertiserId = req.advertiser.id;

    // الشرط: يجب أن يغطي رصيد المعلن تكلفة الإعلانات المطلوبة (تكلفة الشراء)
    const costPerView = rewardAmount * 1.2; // تكلفة الشراء = مكافأة المستخدم + 20% ربح للمالك
    const totalCost = totalViews * costPerView;

    try {
        const advertiser = await Advertiser.findById(advertiserId);
        if (advertiser.balance < totalCost) {
            return res.status(400).json({ msg: `Insufficient funds. Total cost: ${totalCost.toFixed(2)} DZD.` });
        }

        // 1. إنشاء الإعلان
        const newAd = new Ad({
            title,
            url,
            rewardAmount,
            viewDuration,
            totalViews,
            remainingViews: totalViews,
            isActive: true,
            createdBy: advertiserId // ربط الإعلان بالمعلن
        });

        // 2. خصم التكلفة الإجمالية من رصيد المعلن
        advertiser.balance -= totalCost;

        await newAd.save();
        await advertiser.save();

        res.status(201).json({ msg: 'Ad campaign created and launched successfully.', remainingBalance: advertiser.balance.toFixed(2) });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};