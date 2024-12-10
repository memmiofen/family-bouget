const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const DashboardSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    totalBudget: {
        type: Number,
        default: 0
    },
    recentExpenses: [{
        title: String,
        amount: Number,
        category: String,
        date: Date
    }],
    upcomingExpenses: [{
        title: String,
        amount: Number,
        dueDate: Date
    }],
    alerts: [{
        message: String,
        type: {
            type: String,
            enum: ['warning', 'error', 'info']
        }
    }],
    monthlyStats: {
        totalExpenses: Number,
        totalIncome: Number,
        expensesByCategory: [{
            category: String,
            amount: Number
        }],
        dailyExpenses: [{
            date: String,
            amount: Number
        }]
    }
});

module.exports = mongoose.model('Dashboard', DashboardSchema);