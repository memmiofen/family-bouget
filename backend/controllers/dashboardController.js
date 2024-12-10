const Budget = require('../models/Budget');
const Expense = require('../models/Expense');
const Request = require('../models/Request');
const User = require('../models/User');
const Income = require('../models/Income');
const mongoose = require('mongoose');

// פונקציית עזר לחישוב היתרה הנוכחית
exports.calculateCurrentBalance = async (userId) => {
  const userObjectId = new mongoose.Types.ObjectId(userId);

  const totalIncome = await Income.aggregate([
    { $match: { userId: userObjectId } },
    { $group: { _id: null, total: { $sum: "$amount" } } }
  ]);

  const totalExpenses = await Expense.aggregate([
    { $match: { userId: userObjectId } },
    { $group: { _id: null, total: { $sum: "$amount" } } }
  ]);

  return (totalIncome[0]?.total || 0) - (totalExpenses[0]?.total || 0);
};

// מחזיר את הנתונים לדשבורד
exports.getDashboardData = async (req, res) => {
  try {
    const userId = req.params.userId;
    const userObjectId = new mongoose.Types.ObjectId(userId);
    const currentDate = new Date();
    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);

    // מביא את כל ההוצאות של החודש הנוכחי
    const expenses = await Expense.find({
      userId: userObjectId,
      date: { $gte: startOfMonth, $lte: currentDate }
    });

    // מחשב את סך ההוצאות לפי קטגוריה
    const expensesByCategory = expenses.reduce((acc, expense) => {
      const existingCategory = acc.find(cat => cat.category === expense.category);
      if (existingCategory) {
        existingCategory.amount += expense.amount;
      } else {
        acc.push({
          category: expense.category,
          amount: expense.amount,
          isRecurring: expense.isRecurring || false
        });
      }
      return acc;
    }, []);

    // מחשב את סך כל ההוצאות
    const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);

    // מביא את ההוצאות האחרונות
    const recentExpenses = await Expense.find({ userId: userObjectId })
      .sort({ date: -1 })
      .limit(5);

    // מביא את ההוצאות העתידיות
    const upcomingExpenses = await Expense.find({
      userId: userObjectId,
      'recurringDetails.nextDate': { $gt: currentDate }
    })
      .sort({ 'recurringDetails.nextDate': 1 })
      .limit(5);

    // מביא את היתרה הנוכחית
    const currentBalance = await exports.calculateCurrentBalance(userId);

    // מביא את הבקשות הממתינות
    const pendingRequests = await Request.find({
      status: 'pending',
      parentId: userObjectId
    });

    // בודק אם יש התראות
    const alerts = [];
    if (currentBalance < 1000) {
      alerts.push({
        type: 'warning',
        message: 'היתרה בחשבון נמוכה מ-1,000 ש"ח'
      });
    }

    res.json({
      currentBalance,
      totalExpenses,
      expensesByCategory,
      recentExpenses,
      upcomingExpenses,
      alerts,
      pendingRequests: {
        count: pendingRequests.length,
        items: pendingRequests
      }
    });
  } catch (error) {
    console.error('Error getting dashboard data:', error);
    res.status(500).json({ 
      message: 'שגיאה בטעינת נתוני הדשבורד',
      error: error.message 
    });
  }
};
