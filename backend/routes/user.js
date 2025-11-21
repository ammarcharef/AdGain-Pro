const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const withdrawController = require('../controllers/withdrawController'); 
const auth = require('../middleware/authMiddleware');

router.get('/dashboard', auth, userController.getDashboard);
router.put('/', auth, userController.updateProfile); 
router.post('/withdraw', auth, withdrawController.requestWithdrawal);

module.exports = router;