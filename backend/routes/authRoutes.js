const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { authenticate } = require('../middleware/auth');

// הרשמת משתמש חדש
router.post('/register', async (req, res) => {
    try {
        const { username, email, password, role, parentId } = req.body;

        // בדיקה אם המשתמש כבר קיים
        let existingUser = await User.findOne({ 
            $or: [{ email }, { username }] 
        });
        
        if (existingUser) {
            return res.status(400).json({ 
                message: 'משתמש עם אימייל או שם משתמש זה כבר קיים במערכת' 
            });
        }

        // הצפנת הסיסמה
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // יצירת משתמש חדש
        const user = new User({
            username,
            email,
            password: hashedPassword,
            role,
            parentId: role === 'child' ? parentId : null
        });

        await user.save();

        // יצירת טוקן
        const token = jwt.sign(
            { 
                userId: user._id, 
                role: user.role,
                username: user.username
            },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.status(201).json({
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ message: 'שגיאה בהרשמה: ' + error.message });
    }
});

// התחברות משתמש
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // בדיקה אם המשתמש קיים
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ message: 'אימייל או סיסמה שגויים' });
        }

        // בדיקה אם המשתמש נעול
        if (user.lockUntil && user.lockUntil > Date.now()) {
            return res.status(401).json({ 
                message: 'החשבון נעול. נסה שוב מאוחר יותר' 
            });
        }

        // בדיקת סיסמה
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            await user.incrementLoginAttempts();
            return res.status(401).json({ message: 'אימייל או סיסמה שגויים' });
        }

        // איפוס ניסיונות התחברות כושלים
        await user.resetLoginAttempts();

        // עדכון תאריך התחברות אחרון
        user.lastLogin = Date.now();
        await user.save();

        // יצירת טוקן
        const token = jwt.sign(
            { 
                userId: user._id, 
                role: user.role,
                username: user.username
            },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'שגיאה בהתחברות: ' + error.message });
    }
});

// איפוס סיסמה
router.post('/reset-password', authenticate, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const user = await User.findById(req.user.userId);

        if (!user) {
            return res.status(404).json({ message: 'משתמש לא נמצא' });
        }

        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'סיסמה נוכחית שגויה' });
        }

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);
        await user.save();

        res.json({ message: 'הסיסמה שונתה בהצלחה' });
    } catch (error) {
        console.error('Password reset error:', error);
        res.status(500).json({ message: 'שגיאה בשינוי הסיסמה: ' + error.message });
    }
});

module.exports = router;
