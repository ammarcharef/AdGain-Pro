const express = require('express');
const router = express.Router();
const advertiserController = require('../controllers/advertiserController');
const advertiserAuth = require('../middleware/advertiserAuthMiddleware'); 

router.post('/register', advertiserController.registerAdvertiser);
router.post('/login', advertiserController.loginAdvertiser);

router.post('/create-ad', advertiserAuth, advertiserController.createAd);

module.exports = router;