const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Child = require('../models/Child');
const Request = require('../models/Request');
const auth = require('../middleware/auth');

// Get pending requests for a parent
router.get('/pending-requests', auth, async (req, res) => {
    try {
        const parentId = req.user.id;

        // מצא את ההורה ואת הילדים שלו
        const parent = await User.findById(parentId);
        if (!parent || parent.role !== 'parent') {
            return res.status(404).json({ message: 'הורה לא נמצא' });
        }

        console.log("parent:", parent);

        // מצא את כל הילדים של ההורה
        const children = await Child.find({ parent: parentId });
        const childIds = children.map(child => child._id);

        console.log("childIds:", childIds);

        // מצא את כל הבקשות הממתינות מהילדים של ההורה
        const pendingRequests = await Request.find({
            childId: { $in: childIds },
            status: 'pending'
        })
        .populate('childId', 'name')
        .sort({ createdAt: -1 });

        console.log(pendingRequests);

        res.json(pendingRequests);
    } catch (error) {
        console.error('Error in getting pending requests:', error);
        res.status(500).json({ message: 'שגיאת שרת' });
    }
});

// Handle request approval
router.post('/requests/:requestId/approve', auth, async (req, res) => {
    try {
        // מצא את הבקשה ומלא את פרטי הילד
        const request = await Request.findById(req.params.requestId);
        if (!request) {
            return res.status(404).json({ message: 'בקשה לא נמצאה' });
        }

        // מצא את הילד
        const child = await Child.findById(request.childId);
        if (!child) {
            return res.status(404).json({ message: 'ילד לא נמצא' });
        }

        // וודא שההורה מורשה לטפל בבקשה זו
        if (child.parent.toString() !== req.user.id) {
            return res.status(403).json({ message: 'אין לך הרשאה לטפל בבקשה זו' });
        }

        // וודא שהבקשה במצב ממתין
        if (request.status !== 'pending') {
            return res.status(400).json({ message: 'לא ניתן לטפל בבקשה זו' });
        }

        // וודא שיש מספיק תקציב
        if (child.remainingBudget < request.amount) {
            return res.status(400).json({ message: 'אין מספיק תקציב לאישור הבקשה' });
        }

        // עדכן את הבקשה
        request.status = 'approved';
        request.respondedAt = new Date();
        await request.save();

        // עדכן את התקציב של הילד
        child.remainingBudget -= request.amount;
        await child.save();

        res.json({ 
            message: 'הבקשה אושרה בהצלחה', 
            request,
            child: {
                _id: child._id,
                name: child.name,
                remainingBudget: child.remainingBudget
            }
        });
    } catch (error) {
        console.error('Error in approving request:', error);
        res.status(500).json({ message: 'שגיאת שרת' });
    }
});

// Handle request rejection
router.post('/requests/:requestId/reject', auth, async (req, res) => {
    try {
        // מצא את הבקשה ומלא את פרטי הילד
        const request = await Request.findById(req.params.requestId);
        if (!request) {
            return res.status(404).json({ message: 'בקשה לא נמצאה' });
        }

        // מצא את הילד
        const child = await Child.findById(request.childId);
        if (!child) {
            return res.status(404).json({ message: 'ילד לא נמצא' });
        }

        // וודא שההורה מורשה לטפל בבקשה זו
        if (child.parent.toString() !== req.user.id) {
            return res.status(403).json({ message: 'אין לך הרשאה לטפל בבקשה זו' });
        }

        // וודא שהבקשה במצב ממתין
        if (request.status !== 'pending') {
            return res.status(400).json({ message: 'לא ניתן לטפל בבקשה זו' });
        }

        // עדכן את הבקשה
        request.status = 'rejected';
        request.respondedAt = new Date();
        if (req.body.message) {
            request.responseMessage = req.body.message;
        }
        await request.save();

        res.json({ 
            message: 'הבקשה נדחתה', 
            request,
            child: {
                _id: child._id,
                name: child.name,
                remainingBudget: child.remainingBudget
            }
        });
    } catch (error) {
        console.error('Error in rejecting request:', error);
        res.status(500).json({ message: 'שגיאת שרת' });
    }
});

module.exports = router;
