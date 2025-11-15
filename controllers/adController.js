const Ad = require('../models/Ad');
const User = require('../models/User');

const AD_REFERRAL_RATE = 0.10; // 10% للمُحيل
const AD_BASE_XP = 5; // نقاط الخبرة الأساسية لكل مشاهدة

// @route   GET api/ads/available
// @desc    Get all active ads
// @access  Private
exports.getAvailableAds = async (req, res) => {
    try {
        // تم تخفيف الشروط مؤقتاً: نكتفي بالبحث عن الإعلانات النشطة ذات المشاهدات المتبقية > 0
        const ads = await Ad.find({ isActive: true, remainingViews: { $gt: 0 } }).select('-__v');
        
        // التحقق من نوع البيانات
        if (!Array.isArray(ads)) {
             console.error('Ad query did not return an array');
             return res.json([]); // إرجاع قائمة فارغة إذا فشلت المونجوس في الإرجاع
        }
        
        res.json(ads);
    } catch (err) {
        console.error("Error in getAvailableAds:", err.message);
        // إرجاع رسالة خطأ واضحة إذا فشل الكود
        res.status(500).json({ msg: 'Server error during ad fetching.' });
    }
};

// ... (بقية الدالة registerAdView تبقى كما هي)
exports.registerAdView = async (req, res) => {
    // ...
};

// @route   POST api/ads/view/:adId
// @desc    Register a successful ad view and grant reward
// @access  Private
exports.registerAdView = async (req, res) => {
    const adId = req.params.adId;
    const userId = req.user.id;

    try {
        const ad = await Ad.findById(adId);
        const user = await User.findById(userId);

        // 1. تحقق من وجود الإعلان وإمكانية المشاهدة
        if (!ad || ad.remainingViews <= 0 || !ad.isActive) {
            return res.status(404).json({ msg: 'Ad not found or views depleted' });
        }
        
        // 2. حساب مكافأة المستخدم والـ XP
        const baseReward = ad.rewardAmount;
        // افتراض مكافأة مستوى بسيطة
        const levelBonus = user.level * 0.01; 
        const finalReward = baseReward + (baseReward * levelBonus);

        user.balance += finalReward;
        user.xp += AD_BASE_XP;
        
        // التحقق من رفع المستوى (الدالة مضمنة في نموذج User)
        const levelUp = user.levelUp(); 

        // 3. تطبيق مكافأة الإحالة 
        if (user.referredBy) {
            const referrer = await User.findById(user.referredBy);
            if (referrer) {
                const referralReward = baseReward * AD_REFERRAL_RATE; 
                referrer.balance += referralReward;
                await referrer.save();
            }
        }

        // 4. تحديث الإعلان وخفض عدد المشاهدات المتبقية
        ad.remainingViews -= 1;
        await ad.save();
        
        await user.save();

        res.json({ 
            msg: `Ad view successfully registered. Reward: ${finalReward.toFixed(2)} DZD. XP earned: ${AD_BASE_XP}.`,
            newBalance: user.balance.toFixed(2),
            newXP: user.xp,
            newLevel: user.level,
            levelUp: levelUp
        });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

// **تأكد من وجود هذا الملف في المسار: backend/controllers/adController.js**