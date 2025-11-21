const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController'); 
const auth = require('../middleware/authMiddleware');
const adminAuth = require('../middleware/adminMiddleware');

// جميع مسارات المدير تتطلب التوثيق وصلاحية المدير
router.use(auth, adminAuth);

router.get('/dashboard', adminController.getAdminStats);
router.get('/withdrawals/pending', adminController.getPendingWithdrawals);
router.post('/withdrawals/process/:id', adminController.processWithdrawal);

module.exports = router;