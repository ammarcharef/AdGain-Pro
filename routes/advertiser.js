const express = require('express');
const router = express.Router();
const advertiserController = require('../controllers/advertiserController'); // يجب أن يكون هذا الملف موجوداً
const advertiserAuth = require('../middleware/advertiserAuthMiddleware'); 

// @route   POST api/advertiser/register
router.post('/register', advertiserController.registerAdvertiser);

// @route   POST api/advertiser/login
router.post('/login', advertiserController.loginAdvertiser);

// @route   POST api/advertiser/create-ad
// مسار محمي يتطلب توكن المعلن
router.post('/create-ad', advertiserAuth, advertiserController.createAd);

module.exports = router;