const Income = require('../models/Income');
const Expense = require('../models/Expense');
const mongoose = require('mongoose');

exports.addIncome = async (req, res) => {
    try {
        const { amount, source, description } = req.body;
        const userId = req.user.id;

        // המרה ל-ObjectId
        const userObjectId = new mongoose.Types.ObjectId(userId);

        // יצירת הכנסה חדשה
        const newIncome = new Income({
            amount: Number(amount),
            source,
            description,
            userId: userObjectId,
            date: new Date()
        });

        await newIncome.save();

        // חישוב היתרה הכוללת
        const totalIncome = await Income.aggregate([
            { $match: { userId: userObjectId } },
            { $group: { _id: null, total: { $sum: "$amount" } } }
        ]);

        const totalExpenses = await Expense.aggregate([
            { $match: { userId: userObjectId } },
            { $group: { _id: null, total: { $sum: "$amount" } } }
        ]);

        const currentBalance = (totalIncome[0]?.total || 0) - (totalExpenses[0]?.total || 0);

        res.status(201).json({
            message: 'ההכנסה נוספה בהצלחה',
            income: newIncome,
            currentBalance
        });

    } catch (error) {
        console.error('Error adding income:', error);
        res.status(500).json({ message: 'שגיאה בהוספת הכנסה' });
    }
}; 