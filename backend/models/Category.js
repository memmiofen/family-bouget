// models/Category.js
const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    enum: ['food', 'transportation', 'bills', 'entertainment', 'shopping', 'other']
  },
  description: {
    type: String,
    trim: true
  },
  icon: {
    type: String,
    default: 'default-icon' // שם האייקון מספריית האייקונים
  },
  color: {
    type: String,
    default: '#000000' // צבע לתצוגה בממשק
  },
  isDefault: {
    type: Boolean,
    default: false
  },
  order: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// הוספת קטגוריות ברירת מחדל
categorySchema.statics.initializeDefaultCategories = async function () {
  const defaults = [
    {
      name: 'food',
      description: 'הוצאות על מזון וקניות במכולת',
      icon: 'food-icon',
      color: '#FF5733',
      isDefault: true,
      order: 1
    },
    {
      name: 'transportation',
      description: 'הוצאות על תחבורה ודלק',
      icon: 'transport-icon',
      color: '#33FF57',
      isDefault: true,
      order: 2
    },
    // ... שאר הקטגוריות
  ];

  for (const cat of defaults) {
    await this.findOneAndUpdate(
      { name: cat.name },
      cat,
      { upsert: true, new: true }
    );
  }
};

// וירטואל לקבלת מספר ההוצאות בקטגוריה
categorySchema.virtual('expenseCount', {
  ref: 'Expense',
  localField: 'name',
  foreignField: 'category',
  count: true
});

const Category = mongoose.model('Category', categorySchema);

module.exports = Category;