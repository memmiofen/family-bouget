// models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: [true, 'שם משתמש הוא שדה חובה'],
        unique: true,
        trim: true,
        lowercase: true
    },
    email: {
        type: String,
        required: [true, 'אימייל הוא שדה חובה'],
        unique: true,
        trim: true,
        lowercase: true,
        match: [/^\S+@\S+\.\S+$/, 'אנא הכנס כתובת אימייל תקינה']
    },
    password: {
        type: String,
        required: [true, 'סיסמה היא שדה חובה'],
        minlength: [6, 'הסיסמה חייבת להכיל לפחות 6 תווים']
    },
    role: {
        type: String,
        enum: ['parent', 'child'],
        required: [true, 'תפקיד הוא שדה חובה']
    },
    parentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    children: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Child'
    }],
    failedLoginAttempts: {
        type: Number,
        default: 0
    },
    lockUntil: {
        type: Date,
        default: null
    },
    lastLogin: {
        type: Date,
        default: Date.now
    },
    linkCode: {
        type: String,
        default: null
    },
    linkCodeExpires: {
        type: Date,
        default: null
    }
}, {
    timestamps: true
});

// אינדקסים
userSchema.index({ email: 1 });
userSchema.index({ username: 1 });
userSchema.index({ parentId: 1 }, { sparse: true });

// וירטואלים
userSchema.virtual('isLocked').get(function() {
    return this.accountLocked && this.lockUntil > Date.now();
});

// הצפנת סיסמה לפני שמירה
userSchema.pre('save', async function(next) {
    // אם הסיסמה לא שונתה, המשך
    if (!this.isModified('password')) {
        return next();
    }

    try {
        // בדוק אם הסיסמה כבר מוצפנת
        if (this.password.startsWith('$2a$')) {
            return next();
        }

        // הצפן את הסיסמה
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// מתודות סטטיות
userSchema.statics.findByEmail = function(email) {
    return this.findOne({ email: email.toLowerCase() });
};

// השוואת סיסמאות
userSchema.methods.comparePassword = async function(candidatePassword) {
    try {
        return await bcrypt.compare(candidatePassword, this.password);
    } catch (error) {
        throw error;
    }
};

// טיפול בניסיונות התחברות כושלים
userSchema.methods.incrementLoginAttempts = async function() {
    this.failedLoginAttempts += 1;
    
    if (this.failedLoginAttempts >= 5) {
        this.lockUntil = new Date(Date.now() + 30 * 60 * 1000); // נעילה ל-30 דקות
    }
    
    await this.save();
};

// איפוס ניסיונות התחברות
userSchema.methods.resetLoginAttempts = async function() {
    this.failedLoginAttempts = 0;
    this.lockUntil = null;
    await this.save();
};

const User = mongoose.model('User', userSchema);

module.exports = User;