const express = require('express');
const router = express.Router();
const incomeController = require('../controllers/incomeController');
const auth = require('../middleware/auth');

router.post('/', auth, (req, res, next) => {
    console.log('נתוני בקשה:', {
        body: req.body,
        user: req.user,
        headers: req.headers
    });
    next();
}, incomeController.addIncome);

module.exports = router; 