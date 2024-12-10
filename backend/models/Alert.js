// models/Alert.js
const mongoose = require('mongoose');

const AlertSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    message: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ['budget_limit', 'category_limit', 'unusual_expense', 'fixed_expense_due', 'request_pending'],
        required: true
    },
    severity: {
        type: String,
        enum: ['info', 'warning', 'critical'],
        default: 'info'
    },
    relatedData: {
        expenseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Expense' },
        categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
        requestId: { type: mongoose.Schema.Types.ObjectId, ref: 'ExpenseRequest' },
        amount: Number
    },
    isRead: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    expiresAt: {
        type: Date,
        default: function () {
            const date = new Date();
            date.setDate(date.getDate() + 7); // התראות פגות תוקף אחרי שבוע
            return date;
        }
    }
}, {
    timestamps: true
});

// אינדקס לשאילתות נפוצות
AlertSchema.index({ userId: 1, isRead: 1, createdAt: -1 });

// מתודות סטטיות
AlertSchema.statics.createBudgetAlert = async function (userId, amount, budgetLimit) {
    return this.create({
        userId,
        type: 'budget_limit',
        severity: 'warning',
        message: `שים לב! הגעת ל-${Math.round((amount / budgetLimit) * 100)}% מהתקציב החודשי`,
        relatedData: { amount }
    });
};

// מתודה לסימון התראה כנקראה
AlertSchema.methods.markAsRead = function () {
    this.isRead = true;
    return this.save();
};

const Alert = mongoose.model('Alert', AlertSchema);

module.exports = Alert;