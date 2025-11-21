const express = require('express');
const router = express.Router();
const earnController = require('../controllers/earnController');
const postbackController = require('../controllers/postbackController'); 
const auth = require('../middleware/authMiddleware');

router.get('/tasks', auth, earnController.getTasks);
router.post('/claim/:id', auth, earnController.claimReward);
router.get('/postback/:network', postbackController.handlePostback); 

module.exports = router;