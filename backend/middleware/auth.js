// backend/middleware/auth.js
const jwt = require('jsonwebtoken');
const config = require('../config/config');

module.exports = function(req, res, next) {
    // קבלת הטוקן מה-header
    const token = req.header('Authorization')?.replace('Bearer ', '');

    // בדיקה אם לא נמצא טוקן
    if (!token) {
        return res.status(401).json({ message: 'אין הרשאה, נדרשת התחברות' });
    }

    try {
        // אימות הטוקן
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        
        // הוספת המשתמש לבקשה
        req.user = decoded;
        next();
    } catch (err) {
        res.status(401).json({ message: 'טוקן לא תקין' });
    }
};