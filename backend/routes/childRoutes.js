const express = require('express');
const router = express.Router();
const Child = require('../models/Child');
const User = require('../models/User');
const Request = require('../models/Request');
const auth = require('../middleware/auth');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const childAuth = require('../middleware/childAuth');

// הוספת ילד חדש
router.post('/', auth, async (req, res) => {
    try {
        const { name } = req.body;
        if (!name) {
            return res.status(400).json({ message: 'נא להזין שם' });
        }

        // יצירת סיסמה רנדומלית
        const password = Child.generatePassword();
        
        const child = new Child({
            name,
            password,
            parent: req.user.id,
            monthlyAllowance: 0,
            remainingBudget: 0
        });

        await child.save();
        
        // הוספת הילד למערך הילדים של ההורה
        await User.findByIdAndUpdate(req.user.id, {
            $push: { children: child._id }
        });

        res.status(201).json({
            message: 'הילד נוסף בהצלחה',
            child: {
                _id: child._id,
                name: child.name,
                monthlyAllowance: child.monthlyAllowance,
                remainingBudget: child.remainingBudget
            }
        });
    } catch (error) {
        console.error('Error in create child:', error);
        res.status(500).json({ message: error.message });
    }
});

// קבלת כל הילדים של ההורה
router.get('/', auth, async (req, res) => {
    try {
        const children = await Child.find({ parent: req.user.id });
        res.json(children);
    } catch (error) {
        console.error('Error in get children:', error);
        res.status(500).json({ message: error.message });
    }
});

// קבלת ילד ספציפי
router.get('/:childId', auth, async (req, res) => {
    try {
        const child = await Child.findById(req.params.childId);
        if (!child) {
            return res.status(404).json({ message: 'הילד לא נמצא' });
        }

        if (child.parent.toString() !== req.user.id) {
            return res.status(403).json({ message: 'אין הרשאה לצפות בילד זה' });
        }

        res.json(child);
    } catch (error) {
        console.error('Error in get child:', error);
        res.status(500).json({ message: error.message });
    }
});

// קבלת סיסמת ילד
router.get('/:childId/password', auth, async (req, res) => {
    try {
        const child = await Child.findById(req.params.childId);
        if (!child) {
            return res.status(404).json({ message: 'הילד לא נמצא' });
        }

        if (child.parent.toString() !== req.user.id) {
            return res.status(403).json({ message: 'אין הרשאה לצפות בסיסמה' });
        }

        res.json({ password: child.password });
    } catch (error) {
        console.error('Error in get child password:', error);
        res.status(500).json({ message: error.message });
    }
});

// מחיקת ילד
router.delete('/:childId', auth, async (req, res) => {
    try {
        const child = await Child.findById(req.params.childId);
        if (!child) {
            return res.status(404).json({ message: 'הילד לא נמצא' });
        }

        if (child.parent.toString() !== req.user.id) {
            return res.status(403).json({ message: 'אין הרשאה למחוק ילד זה' });
        }

        // מחיקת כל הבקשות של הילד
        await Request.deleteMany({ childId: child._id });

        // הסרת הילד מרשימת הילדים של ההורה
        await User.findByIdAndUpdate(req.user.id, {
            $pull: { children: child._id }
        });

        // מחיקת הילד
        await Child.deleteOne({ _id: child._id });

        res.json({ message: 'הילד נמחק בהצלחה' });
    } catch (error) {
        console.error('Error in delete child:', error);
        res.status(500).json({ message: error.message });
    }
});

// עדכון תקציב
router.post('/:childId/add-budget', auth, async (req, res) => {
    try {
        const { amount, action } = req.body;
        
        if (!amount || typeof amount !== 'number' || amount <= 0) {
            return res.status(400).json({ message: 'סכום לא תקין' });
        }

        const child = await Child.findById(req.params.childId);
        if (!child) {
            return res.status(404).json({ message: 'ילד לא נמצא' });
        }

        // בדיקת הרשאות
        if (req.user.role === 'parent' && child.parent.toString() !== req.user.id) {
            return res.status(403).json({ message: 'אין לך הרשאה לעדכן תקציב לילד זה' });
        }

        // עדכון התקציב
        if (action === 'add') {
            child.remainingBudget += amount;
        } else if (action === 'reduce') {
            child.remainingBudget -= amount;
        } else {
            return res.status(400).json({ message: 'פעולה לא תקינה' });
        }

        await child.save();

        res.json({ 
            message: `התקציב ${action === 'add' ? 'הוגדל' : 'הוקטן'} בהצלחה`,
            child 
        });
    } catch (error) {
        console.error('Error updating budget:', error);
        res.status(500).json({ message: 'שגיאת שרת' });
    }
});

// התחברות ילד
router.post('/login', async (req, res) => {
    try {
        const { password } = req.body;

        if (!password) {
            return res.status(400).json({ message: 'נא להזין סיסמה' });
        }

        // מציאת הילד לפי הסיסמה
        const child = await Child.findOne({ password });
        
        if (!child) {
            return res.status(401).json({ message: 'סיסמה שגויה' });
        }

        // יצירת טוקן
        const token = jwt.sign(
            { id: child._id },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        // החזרת פרטי הילד והטוקן
        res.json({
            token,
            child: {
                id: child._id,
                name: child.name,
                monthlyAllowance: child.monthlyAllowance,
                remainingBudget: child.remainingBudget
            }
        });
    } catch (error) {
        console.error('Error in child login:', error);
        res.status(500).json({ message: 'שגיאה בהתחברות' });
    }
});

// קבלת נתוני ילד
router.get('/:id/data', childAuth, async (req, res) => {
    try {
        const childId = req.params.id;
        
        const child = await Child.findById(childId)
            .select('-password');

        if (!child) {
            return res.status(404).json({ message: 'הילד לא נמצא' });
        }

        res.json({
            name: child.name,
            monthlyAllowance: child.monthlyAllowance,
            remainingBudget: child.remainingBudget,
            expenses: child.expenses || []
        });
    } catch (error) {
        console.error('Error in GET /children/:childId/data:', error);
        res.status(500).json({ message: 'שגיאת שרת', error: error.message });
    }
});

// שליחת בקשה חדשה
router.post('/:childId/requests', childAuth, async (req, res) => {
    try {
        const { amount, description, category } = req.body;
        const childId = req.params.childId;

        // בדיקת תקינות הנתונים
        if (!amount || !description || !category) {
            return res.status(400).json({ message: 'נא למלא את כל השדות' });
        }

        // וידוא שהקטגוריה תקינה
        const validCategories = ['משחקים', 'בגדים', 'ממתקים', 'צעצועים', 'ספרים', 'בילויים', 'אחר'];
        if (!validCategories.includes(category)) {
            return res.status(400).json({ message: 'קטגוריה לא תקינה' });
        }

        // מציאת הילד
        const child = await Child.findById(childId);
        if (!child) {
            return res.status(404).json({ message: 'הילד לא נמצא' });
        }

        // יצירת בקשה חדשה
        const request = new Request({
            childId,
            amount: parseFloat(amount),
            description,
            category,
            status: 'pending',
            createdAt: new Date()
        });

        // שמירת הבקשה
        await request.save();

        // החזרת תשובה
        res.status(201).json({
            message: 'הבקשה נשלחה בהצלחה',
            request: {
                _id: request._id,
                amount: request.amount,
                description: request.description,
                category: request.category,
                status: request.status,
                createdAt: request.createdAt
            }
        });
    } catch (error) {
        console.error('Error in POST /children/:childId/requests:', error);
        res.status(500).json({ 
            message: 'שגיאה בשליחת הבקשה',
            error: error.message 
        });
    }
});

// קבלת הבקשות של הילד
router.get('/:childId/requests', childAuth, async (req, res) => {
    try {
        const childId = req.params.childId;

        // מציאת כל הבקשות של הילד
        const requests = await Request.find({ childId })
            .sort({ createdAt: -1 });

        res.json(requests.map(req => ({
            _id: req._id,
            amount: req.amount,
            description: req.description,
            category: req.category,
            status: req.status,
            createdAt: req.createdAt,
            responseMessage: req.responseMessage
        })));
    } catch (error) {
        console.error('Error in GET /children/:childId/requests:', error);
        res.status(500).json({ 
            message: 'שגיאה בקבלת הבקשות',
            error: error.message 
        });
    }
});

// בדיקה אם יש בקשות חדשות
router.get('/requests/new', auth, async (req, res) => {
    try {
        const children = await Child.find({ parent: req.user.id });
        const childIds = children.map(child => child._id);
        
        const newRequests = await Request.find({
            childId: { $in: childIds },
            status: 'pending',
            createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // בקשות מה-24 שעות האחרונות
        });

        res.json({ hasNew: newRequests.length > 0 });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// עדכון סטטוס בקשה
router.put('/requests/:requestId', auth, async (req, res) => {
    try {
        const { status, message } = req.body;
        const requestId = req.params.requestId;

        const request = await Request.findById(requestId);
        if (!request) {
            return res.status(404).json({ message: 'הבקשה לא נמצאה' });
        }

        // וידוא שהבקשה שייכת לילד של ההורה המחובר
        const child = await Child.findById(request.childId);
        if (child.parent.toString() !== req.user.id) {
            return res.status(403).json({ message: 'אין הרשאה לעדכן בקשה זו' });
        }

        request.status = status;
        request.responseMessage = message;
        request.respondedAt = new Date();
        await request.save();

        // אם הבקשה אושרה, עדכון התקציב הנותר של הילד
        if (status === 'approved') {
            child.remainingBudget -= request.amount;
            await child.save();
        }

        res.json(request);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// עדכון תקציב חודשי של ילד
router.put('/:childId/budget', auth, async (req, res) => {
    try {
        const { monthlyBudget } = req.body;
        const childId = req.params.childId;

        const child = await Child.findById(childId);
        if (!child) {
            return res.status(404).json({ message: 'הילד לא נמצא' });
        }

        if (child.parent.toString() !== req.user.id) {
            return res.status(403).json({ message: 'אין הרשאה לעדכן ילד זה' });
        }

        // חישוב ההפרש בין התקציב החדש לישן
        const budgetDiff = monthlyBudget - child.monthlyAllowance;
        
        child.monthlyAllowance = monthlyBudget;
        child.remainingBudget += budgetDiff; // עדכון התקציב הנותר בהתאם לשינוי
        
        await child.save();

        res.json(child);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
