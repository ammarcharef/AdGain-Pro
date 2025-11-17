const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const userController = require('../controllers/userController');
const withdrawController = require('../controllers/withdrawController');

// @route   GET api/user/dashboard (لجلب بيانات المستخدم)
router.get('/dashboard', auth, userController.getDashboard);

// @route   PUT api/user/
// @desc    تحديث إعدادات الملف الشخصي (بما في ذلك كلمة مرور السحب وتفاصيل الدفع)
router.put('/', auth, userController.updateProfile); 

// @route   POST api/user/withdraw
// @desc    طلب سحب الأرباح (الآن يستخدم كلمة مرور السحب)
router.post('/withdraw', auth, withdrawController.requestWithdrawal); 

module.exports = router;