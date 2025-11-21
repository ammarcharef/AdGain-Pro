const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const adminAuth = require('../middleware/adminMiddleware');
const adminController = require('../controllers/adminController');

// يجب استخدام كل من auth للتأكد من تسجيل الدخول و adminAuth للتأكد من الصلاحية
router.use(auth, adminAuth); 

// @route   GET api/admin/dashboard
router.get('/dashboard', adminController.getAdminStats);

// @route   GET api/admin/withdrawals/pending
router.get('/withdrawals/pending', adminController.getPendingWithdrawals);

// @route   POST api/admin/withdrawals/process/:id
router.post('/withdrawals/process/:id', adminController.processWithdrawal);

// @route   POST api/admin/user/block/:id
router.post('/user/block/:id', adminController.blockUser);

module.exports = router;