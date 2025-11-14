const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const adController = require('../controllers/adController');

// @route   GET api/ads/available
// @desc    Get all active ads
router.get('/available', auth, adController.getAvailableAds); // الخطأ كان هنا: getAvailableAds لم تكن معرفة

// @route   POST api/ads/view/:adId
// @desc    Register a successful ad view
router.post('/view/:adId', auth, adController.registerAdView);

module.exports = router;