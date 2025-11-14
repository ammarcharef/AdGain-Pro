const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const taskController = require('../controllers/taskController');

// @route   GET api/tasks/available
// @desc    Get all available microtasks
router.get('/available', auth, taskController.getAvailableTasks);

// @route   POST api/tasks/complete/:taskId
// @desc    Complete a task
router.post('/complete/:taskId', auth, taskController.completeTask);

module.exports = router;