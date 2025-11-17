const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const userController = require('../controllers/userController');
const withdrawController = require('../controllers/withdrawController');

// @route   GET api/user/dashboard (لجلب بيانات المستخدم)
router.get('/dashboard', auth, userController.getDashboard);

// @route   POST api/user/withdraw
// @desc    طلب سحب الأرباح
router.post('/withdraw', auth, withdrawController.requestWithdrawal); 

module.exports = router;