// models/Expense.js
const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    category: {
        type: String,
        required: true
    },
    date: {
        type: Date,
        default: Date.now
    },
    isRecurring: {
        type: Boolean,
        default: false
    },
    recurringDetails: {
        frequency: {
            type: String,
            enum: ['monthly'],
            required: function() { return this.isRecurring; }
        },
        nextDate: {
            type: Date,
            required: function() { return this.isRecurring; }
        }
    }
});

const Expense = mongoose.model('Expense', expenseSchema);
module.exports = Expense;
