// models/Budget.js
const mongoose = require('mongoose');

const budgetSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    month: {
        type: Number,
        required: true
    },
    year: {
        type: Number,
        required: true
    },
    categories: {
        type: Map,
        of: {
            limit: Number,
            used: { type: Number, default: 0 }
        }
    }
});

// הוספת מתודה סטטית לקבלת התקציב הנוכחי
budgetSchema.statics.getCurrentBudget = async function(userId) {
    const now = new Date();
    return this.findOne({
        userId: new mongoose.Types.ObjectId(userId),
        month: now.getMonth() + 1,
        year: now.getFullYear()
    });
};

// מתודה לעדכון השימוש בקטגוריה
budgetSchema.methods.updateCategoryUsage = async function(category, amount) {
    if (!this.categories.has(category)) {
        this.categories.set(category, { limit: 0, used: 0 });
    }
    
    const categoryData = this.categories.get(category);
    categoryData.used += amount;
    this.categories.set(category, categoryData);
    
    return this.save();
};

const Budget = mongoose.model('Budget', budgetSchema);

module.exports = Budget;