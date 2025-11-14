const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const userController = require('../controllers/userController');

// @route   GET api/user/dashboard
// @desc    Get user profile and balance
router.get('/dashboard', auth, userController.getDashboard);

// @route   POST api/user/withdraw
// @desc    Request withdrawal
router.post('/withdraw', auth, userController.requestWithdrawal);

module.exports = router;