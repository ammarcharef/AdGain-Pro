const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// @route   POST api/auth/register
// @desc    Register user
router.post('/register', authController.registerUser);

// @route   POST api/auth/login
// @desc    Authenticate user
router.post('/login', authController.loginUser);

module.exports = router;