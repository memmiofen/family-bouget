const mongoose = require('mongoose');

const requestSchema = new mongoose.Schema({
    childId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Child', 
        required: true 
    },
    amount: { 
        type: Number, 
        required: true,
        min: 0
    },
    category: { 
        type: String, 
        required: true,
        enum: ['משחקים', 'בגדים', 'ממתקים', 'צעצועים', 'ספרים', 'בילויים', 'אחר']
    },
    description: { 
        type: String, 
        required: true,
        maxlength: 500
    },
    status: { 
        type: String, 
        enum: ['pending', 'approved', 'rejected'], 
        default: 'pending'
    },
    responseMessage: {
        type: String,
        maxlength: 1000
    },
    createdAt: { 
        type: Date, 
        default: Date.now
    },
    respondedAt: { 
        type: Date 
    }
});

// וירטואלי - זמן המתנה בשעות
requestSchema.virtual('waitingTime').get(function() {
    if (this.respondedAt) {
        return Math.round((this.respondedAt - this.createdAt) / (1000 * 60 * 60));
    }
    return Math.round((Date.now() - this.createdAt) / (1000 * 60 * 60));
});

// הגדרת toJSON כדי שיכלול שדות וירטואליים
requestSchema.set('toJSON', {
    virtuals: true,
    transform: function(doc, ret) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        return ret;
    }
});

module.exports = mongoose.model('Request', requestSchema);
