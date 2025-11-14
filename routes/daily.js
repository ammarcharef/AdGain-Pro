const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const dailyController = require('../controllers/dailyController');

// @route   POST api/daily/checkin
// @desc    Claim daily reward
router.post('/checkin', auth, dailyController.dailyCheckIn);

module.exports = router;