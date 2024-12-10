// controllers/fixedExpenseController.js
const FixedExpense = require('../models/Expense');
const Alert = require('../models/Alert');

exports.addFixedExpense = async (req, res) => {
    try {
        const { 
            amount, 
            category, 
            description, 
            recurringDetails 
        } = req.body;
        const userId = req.user.userId;

        const newFixedExpense = new FixedExpense({
            userId,
            amount,
            category,
            description,
            isRecurring: true,
            recurringDetails,
            date: new Date()
        });

        await newFixedExpense.save();

        res.status(201).json({
            message: 'ההוצאה הקבועה נוספה בהצלחה',
            expense: newFixedExpense
        });

    } catch (error) {
        res.status(500).json({ error: 'שגיאה בהוספת ההוצאה הקבועה' });
    }
};

exports.getFixedExpenses = async (req, res) => {
    try {
        const userId = req.user.userId;

        const fixedExpenses = await FixedExpense.find({
            userId,
            isRecurring: true
        }).sort({ 'recurringDetails.nextDate': 1 });

        res.json(fixedExpenses);

    } catch (error) {
        res.status(500).json({ error: 'שגיאה בקבלת ההוצאות הקבועות' });
    }
};

exports.updateFixedExpense = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;
        const userId = req.user.userId;

        const expense = await FixedExpense.findOne({ _id: id, userId });
        if (!expense) {
            return res.status(404).json({ error: 'ההוצאה הקבועה לא נמצאה' });
        }

        Object.assign(expense, updateData);
        await expense.save();

        res.json({
            message: 'ההוצאה הקבועה עודכנה בהצלחה',
            expense
        });

    } catch (error) {
        res.status(500).json({ error: 'שגיאה בעדכון ההוצאה הקבועה' });
    }
};

exports.deleteFixedExpense = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId;

        const expense = await FixedExpense.findOneAndDelete({ _id: id, userId });
        if (!expense) {
            return res.status(404).json({ error: 'ההוצאה הקבועה לא נמצאה' });
        }

        res.json({ message: 'ההוצאה הקבועה נמחקה בהצלחה' });

    } catch (error) {
        res.status(500).json({ error: 'שגיאה במחיקת ההוצאה הקבועה' });
    }
};

// תזמון הוצאות קבועות
exports.scheduleFixedExpenses = async () => {
    try {
        const today = new Date();
        
        // מציאת כל ההוצאות הקבועות שצריכות להתבצע היום
        const dueExpenses = await FixedExpense.find({
            isRecurring: true,
            'recurringDetails.nextDate': {
                $lte: today
            }
        });

        for (const expense of dueExpenses) {
            // יצירת הוצאה חדשה
            const newExpense = new FixedExpense({
                userId: expense.userId,
                amount: expense.amount,
                category: expense.category,
                description: expense.description,
                date: today,
                isRecurring: false,
                parentExpenseId: expense._id
            });

            await newExpense.save();

            // עדכון התאריך הבא להוצאה הקבועה
            const nextDate = new Date(expense.recurringDetails.nextDate);
            switch (expense.recurringDetails.frequency) {
                case 'monthly':
                    nextDate.setMonth(nextDate.getMonth() + 1);
                    break;
                case 'weekly':
                    nextDate.setDate(nextDate.getDate() + 7);
                    break;
                case 'yearly':
                    nextDate.setFullYear(nextDate.getFullYear() + 1);
                    break;
            }

            expense.recurringDetails.nextDate = nextDate;
            await expense.save();

            // יצירת התראה למשתמש
            await Alert.create({
                userId: expense.userId,
                type: 'fixed_expense_executed',
                message: `בוצעה הוצאה קבועה: ${expense.description} - ${expense.amount} ש"ח`,
                relatedData: {
                    expenseId: newExpense._id,
                    amount: expense.amount
                }
            });
        }

    } catch (error) {
        console.error('שגיאה בתזמון הוצאות קבועות:', error);
    }
};

module.exports = exports;