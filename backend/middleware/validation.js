const mongoose = require('mongoose');

// וולידציה של מזהה משתמש
exports.validateUserId = (req, res, next) => {
    const { userId } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(400).json({ 
            message: 'מזהה משתמש לא תקין' 
        });
    }
    
    next();
};

// וולידציה של נתוני הוצאה
exports.validateExpenseData = (req, res, next) => {
    const { amount, category, title } = req.body;
    
    if (!amount || !category || !title) {
        return res.status(400).json({ 
            message: 'חסרים שדות חובה' 
        });
    }
    
    if (amount <= 0) {
        return res.status(400).json({ 
            message: 'סכום חייב להיות גדול מ-0' 
        });
    }
    
    next();
};

// וולידציה של נתוני תקציב
exports.validateBudgetData = (req, res, next) => {
    const { amount, startDate, endDate } = req.body;
    
    if (!amount || !startDate || !endDate) {
        return res.status(400).json({ 
            message: 'חסרים שדות חובה' 
        });
    }
    
    if (amount <= 0) {
        return res.status(400).json({ 
            message: 'סכום תקציב חייב להיות גדול מ-0' 
        });
    }
    
    if (new Date(startDate) >= new Date(endDate)) {
        return res.status(400).json({ 
            message: 'תאריך התחלה חייב להיות לפני תאריך סיום' 
        });
    }
    
    next();
}; 