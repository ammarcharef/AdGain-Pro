const Ad = require('../models/Ad');
const User = require('../models/User');

const AD_REFERRAL_RATE = 0.10; 
const AD_BASE_XP = 5; 

// @route   GET api/ads/available
exports.getAvailableAds = async (req, res) => {
    try {
        // تم تخفيف الشروط لضمان العرض بعد حل مشكلة types
        const ads = await Ad.find({ isActive: true, remainingViews: { $gt: 0 } }).select('-__v');
        
        if (!Array.isArray(ads)) {
             console.error('Ad query did not return an array');
             return res.json([]);
        }
        
        res.json(ads);
    } catch (err) {
        console.error("Error in getAvailableAds:", err.message);
        res.status(500).json({ msg: 'Server error during ad fetching.' });
    }
};

exports.registerAdView = async (req, res) => {
    // ... (منطق تسجيل المشاهدة)
    const adId = req.params.adId;
    const userId = req.user.id;

    try {
        const ad = await Ad.findById(adId);
        const user = await User.findById(userId);

        if (!ad || ad.remainingViews <= 0 || !ad.isActive) {
            return res.status(404).json({ msg: 'Ad not found or views depleted' });
        }
        
        const baseReward = ad.rewardAmount;
        const levelBonus = user.level * 0.01; 
        const finalReward = baseReward + (baseReward * levelBonus);

        user.balance += finalReward;
        user.xp += AD_BASE_XP;
        
        const levelUp = user.levelUp(); 

        if (user.referredBy) {
            const referrer = await User.findById(user.referredBy);
            if (referrer) {
                const referralReward = baseReward * AD_REFERRAL_RATE; 
                referrer.balance += referralReward;
                await referrer.save();
            }
        }

        ad.remainingViews -= 1;
        await ad.save();
        await user.save();

        res.json({ 
            msg: `Ad view registered. Reward: ${finalReward.toFixed(2)} DZD. XP earned: ${AD_BASE_XP}.`,
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