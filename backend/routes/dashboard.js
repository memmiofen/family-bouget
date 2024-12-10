const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const auth = require('../middleware/auth');

// קבלת נתוני דשבורד
router.get('/getDashboardData/:userId', auth, dashboardController.getDashboardData);

module.exports = router;
