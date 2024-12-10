// controllers/requestController.js
const Request = require('../models/Request');
const User = require('../models/User');
const Alert = require('../models/Alert');
const Budget = require('../models/Budget');
const Expense = require('../models/Expense');
const { refreshDashboardInternal } = require('./dashboardController');

exports.createRequest = async (req, res) => {
    try {
        const { amount, description, category } = req.body;
        const childId = req.user.userId;
        
        // מציאת ההורה המקושר
        const child = await User.findById(childId);
        if (!child || !child.parentId) {
            return res.status(400).json({ error: 'לא נמצא הורה מקושר' });
        }

        const request = new Request({
            childId,
            parentId: child.parentId,
            amount,
            description,
            category,
            requestDate: new Date(),
            status: 'pending'
        });

        await request.save();

        // יצירת התראה להורה
        await Alert.create({
            userId: child.parentId,
            type: 'new_request',
            message: `התקבלה בקשה חדשה מ-${child.username}`,
            relatedData: {
                requestId: request._id,
                amount,
                description
            }
        });

        res.status(201).json(request);
    } catch (error) {
        res.status(500).json({ error: 'שגיאה ביצירת הבקשה' });
    }
};

exports.getRequests = async (req, res) => {
    try {
        const { userId, role } = req.user;
        const { status, startDate, endDate } = req.query;

        let query = {};
        
        // הורה רואה את כל הבקשות של הילדים שלו
        // ילד רואה רק את הבקשות שלו
        if (role === 'parent') {
            query.parentId = userId;
        } else {
            query.childId = userId;
        }

        if (status) {
            query.status = status;
        }

        if (startDate && endDate) {
            query.date = {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            };
        }

        const requests = await Request.find(query)
            .sort({ date: -1 })
            .populate('childId', 'username')
            .exec();

        res.json(requests);

    } catch (error) {
        res.status(500).json({ error: 'שגיאה בקבלת הבקשות' });
    }
};

exports.respondToRequest = async (req, res) => {
    try {
        const { requestId } = req.params;
        const { status, transferMethod, transferDetails } = req.body;
        const parentId = req.user.userId;

        const request = await Request.findById(requestId).populate('childId');
        if (!request) {
            return res.status(404).json({ error: 'הבקשה לא נמצאה' });
        }

        if (request.parentId.toString() !== parentId) {
            return res.status(403).json({ error: 'אין הרשאה לטפל בבקשה זו' });
        }

        if (request.status !== 'pending') {
            return res.status(400).json({ error: 'לא ניתן לשנות בקשה שכבר טופלה' });
        }

        if (status === 'approved') {
            const budget = await Budget.findOne({ userId: parentId });
            if (!budget) {
                return res.status(400).json({ error: 'לא נמצא תקציב' });
            }

            if (budget.amount < request.amount) {
                return res.status(400).json({ error: 'אין מספיק כסף בתקציב' });
            }

            budget.amount -= request.amount;
            await budget.save();

            // יצירת הוצאה חדשה
            await Expense.create({
                userId: parentId,
                amount: request.amount,
                category: 'העברה לילד',
                description: `העברה ל${request.childId.username}: ${request.description}`,
                date: new Date()
            });

            request.transferMethod = transferMethod;
            request.transferDetails = transferDetails;
        }

        request.status = status;
        request.responseDate = new Date();
        await request.save();

        // יצירת התראה לילד
        await Alert.create({
            userId: request.childId._id,
            type: 'request_response',
            message: `הבקשה שלך ${status === 'approved' ? 'אושרה' : 'נדחתה'}`,
            relatedData: {
                requestId: request._id,
                status,
                transferMethod,
                transferDetails
            }
        });

        // רענון הדשבורד של שני הצדדים
        await refreshDashboardInternal(parentId);
        await refreshDashboardInternal(request.childId._id);

        res.json({
            message: 'התגובה נשמרה בהצלחה',
            request
        });

    } catch (error) {
        console.error('שגיאה בטיפול בבקשה:', error);
        res.status(500).json({ error: 'שגיאה בטיפול בבקשה' });
    }
};

exports.deleteRequest = async (req, res) => {
    try {
        const { requestId } = req.params;
        const { userId, role } = req.user;

        const request = await Request.findById(requestId);
        if (!request) {
            return res.status(404).json({ error: 'הבקשה לא נמצאה' });
        }

        // רק הילד שיצר את הבקשה יכול למחוק אותה, וזה רק אם היא עדיין ממתינה
        if (role === 'child' && (request.childId.toString() !== userId || request.status !== 'pending')) {
            return res.status(403).json({ error: 'אין הרשאה למחוק בקשה זו' });
        }

        await Request.findByIdAndDelete(requestId);
        res.json({ message: 'הבקשה נמחקה בהצלחה' });

    } catch (error) {
        res.status(500).json({ error: 'שגיאה במחיקת הבקשה' });
    }
};

module.exports = exports;