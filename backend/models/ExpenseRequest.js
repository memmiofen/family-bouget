// models/ExpenseRequest.js
const mongoose = require('mongoose');

const expenseRequestSchema = new mongoose.Schema({
  childId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  parentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: [0, 'סכום הבקשה חייב להיות חיובי']
  },
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: [200, 'התיאור ארוך מדי - מקסימום 200 תווים']
  },
  category: {
    type: String,
    enum: ['food', 'transportation', 'entertainment', 'shopping', 'other'],
    required: true,
    default: 'other'
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  parentComment: {
    type: String,
    trim: true,
    maxlength: [200, 'ההערה ארוכה מדי - מקסימום 200 תווים']
  },
  requestDate: {
    type: Date,
    default: Date.now
  },
  responseDate: {
    type: Date
  },
  urgency: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  }
}, {
  timestamps: true
});

// אינדקס לשיפור ביצועים
expenseRequestSchema.index({ childId: 1, status: 1, requestDate: -1 });
expenseRequestSchema.index({ parentId: 1, status: 1, requestDate: -1 });

// וירטואל לחישוב זמן המתנה
expenseRequestSchema.virtual('waitingTime').get(function () {
  if (this.status === 'pending') {
    return Date.now() - this.requestDate;
  }
  return this.responseDate - this.requestDate;
});

// מתודה סטטית לקבלת סטטיסטיקות בקשות
expenseRequestSchema.statics.getRequestStats = async function (userId, isParent) {
  const matchField = isParent ? 'parentId' : 'childId';
  return this.aggregate([
    {
      $match: {
        [matchField]: new mongoose.Types.ObjectId(userId)
      }
    },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalAmount: { $sum: '$amount' }
      }
    }
  ]);
};

// מתודה להוספת הערת הורה ועדכון סטטוס
expenseRequestSchema.methods.respond = async function (status, comment) {
  this.status = status;
  this.parentComment = comment;
  this.responseDate = new Date();
  return this.save();
};

// וולידציה שהילד לא יכול לאשר את הבקשה שלו עצמו
expenseRequestSchema.pre('save', async function (next) {
  if (this.isModified('status') && this.status === 'approved') {
    const child = await mongoose.model('User').findById(this.childId);
    if (!child || child.role !== 'child') {
      throw new Error('רק הורה יכול לאשר בקשות');
    }
  }
  next();
});

const ExpenseRequest = mongoose.model('ExpenseRequest', expenseRequestSchema);

module.exports = ExpenseRequest;