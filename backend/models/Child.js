const mongoose = require('mongoose');

const requestSchema = new mongoose.Schema({
    amount: {
        type: Number,
        required: true
    },
    category: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    },
    responseMessage: {
        type: String
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    respondedAt: {
        type: Date
    }
});

const expenseSchema = new mongoose.Schema({
    amount: {
        type: Number,
        required: true
    },
    category: {
        type: String,
        required: true
    },
    description: String,
    date: {
        type: Date,
        default: Date.now
    }
});

const childSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    parent: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    monthlyAllowance: {
        type: Number,
        default: 0
    },
    remainingBudget: {
        type: Number,
        default: 0
    },
    requests: [requestSchema],
    expenses: [expenseSchema]
});

// מתודות סטטיות
childSchema.statics.generatePassword = function() {
    return Math.random().toString(36).slice(-8);
};

// מתודות של המסמך
childSchema.methods.updateMonthlyBudget = function(amount) {
    this.monthlyAllowance = (this.monthlyAllowance || 0) + Number(amount);
    this.remainingBudget = (this.remainingBudget || 0) + Number(amount);
    return this.save();
};

childSchema.methods.addRequest = function(requestData) {
    this.requests.push(requestData);
    return this.save();
};

childSchema.methods.updateRequestStatus = function(requestId, status, message) {
    const request = this.requests.id(requestId);
    if (!request) {
        throw new Error('הבקשה לא נמצאה');
    }
    
    request.status = status;
    request.responseMessage = message;
    request.respondedAt = new Date();
    
    if (status === 'approved') {
        this.remainingBudget -= request.amount;
        this.expenses.push({
            amount: request.amount,
            category: request.category,
            description: request.description
        });
    }
    
    return this.save();
};

module.exports = mongoose.model('Child', childSchema);
