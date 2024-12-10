const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const userController = require('../controllers/userController');
const User = require('../models/User');
const auth = require('../middleware/auth');

// נתיב בדיקה למשתמשים
router.get('/check-users', async (req, res) => {
    try {
        const users = await User.find({}, { password: 0 }); // לא מחזיר סיסמאות
        res.json({ users, count: users.length });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// קבלת מידע על משתמש ספציפי
router.get('/users/:userId', auth, async (req, res) => {
    try {
        const user = await User.findById(req.params.userId).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'משתמש לא נמצא' });
        }
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: 'שגיאה בקבלת פרטי משתמש', error: error.message });
    }
});

router.post('/signup', [
    check('username', 'שם משתמש הוא שדה חובה').notEmpty(),
    check('email', 'נדרש אימייל תקין').isEmail(),
    check('password', 'נדרשת סיסמה באורך 6 תווים לפחות').isLength({ min: 6 }),
    check('role', 'נדרש תפקיד תקין').isIn(['parent', 'child'])
], userController.signup);

router.post('/login', userController.login);
router.post('/check-email', userController.checkEmail);
router.post('/check-username', userController.checkUsername);
router.post('/forgot-password', userController.forgotPassword);

module.exports = router;