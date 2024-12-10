const mongoose = require('mongoose');

const IncomeSchema = new mongoose.Schema({
    amount: {
        type: Number,
        required: true
    },
    source: {
        type: String,
        required: true
    },
    description: String,
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    date: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Income', IncomeSchema); 