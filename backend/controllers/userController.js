// controllers/userController.js
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { validationResult } = require('express-validator');

// יצירת טוקן
const generateToken = (user) => {
    return jwt.sign(
        { 
            id: user._id,
            role: user.role
        },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '24h' }
    );
};

// בדיקת זמינות שם משתמש
exports.checkUsername = async (req, res) => {
    try {
        const { username } = req.body;
        const user = await User.findOne({ username: username.toLowerCase() });
        res.json({ exists: !!user });
    } catch (error) {
        res.status(500).json({ message: 'שגיאה בבדיקת שם המשתמש', error: error.message });
    }
};

// בדיקת זמינות אימייל
exports.checkEmail = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email: email.toLowerCase() });
        res.json({ exists: !!user });
    } catch (error) {
        res.status(500).json({ message: 'שגיאה בבדיקת האימייל', error: error.message });
    }
};

// הרשמה
exports.signup = async (req, res) => {
    try {
        console.log('התחלת תהליך הרשמה:', req.body);
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            console.log('שגיאות ולידציה:', errors.array());
            return res.status(400).json({ errors: errors.array() });
        }

        const { username, email, password, role, parentEmail } = req.body;
        
        // בדיקת משתמש קיים
        console.log('בודק משתמש קיים עם:', { email, username });
        const existingUser = await User.findOne({
            $or: [
                { email: email.toLowerCase() },
                { username: username.toLowerCase() }
            ]
        });

        if (existingUser) {
            console.log('נמצא משתמש קיים:', existingUser);
            if (existingUser.email === email.toLowerCase()) {
                return res.status(400).json({ message: 'כתובת האימייל כבר קיימת במערכת' });
            }
            if (existingUser.username === username.toLowerCase()) {
                return res.status(400).json({ message: 'שם המשתמש כבר קיים במערכת' });
            }
        }

        // אם זה ילד, בדוק שההורה קיים
        if (role === 'child' && parentEmail) {
            const parent = await User.findOne({ 
                email: parentEmail.toLowerCase(),
                role: 'parent'
            });
            
            if (!parent) {
                return res.status(400).json({ 
                    message: 'לא נמצא הורה עם כתובת האימייל שהוזנה'
                });
            }
        }

        // יצירת משתמש חדש
        console.log('מנסה ליצור משתמש חדש');
        const user = new User({
            username: username.toLowerCase(),
            email: email.toLowerCase(),
            password: password, // הסיסמה תוצפן אוטומטית במודל
            role,
            parentEmail: role === 'child' ? parentEmail.toLowerCase() : undefined
        });

        try {
            await user.save();
            console.log('משתמש נשמר בהצלחה:', {
                id: user._id,
                username: user.username,
                email: user.email,
                role: user.role
            });
        } catch (saveError) {
            console.error('שגיאה בשמירת המשתמש:', saveError);
            throw saveError;
        }

        // יצירת טוקן
        const token = generateToken(user);
        console.log('טוקן נוצר בהצלחה');

        res.status(201).json({
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                role: user.role
            }
        });

    } catch (error) {
        console.error('שגיאה בהרשמה:', {
            message: error.message,
            stack: error.stack,
            name: error.name
        });
        res.status(500).json({ 
            message: 'שגיאה בהרשמה', 
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};

// התחברות
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        console.log('ניסיון התחברות עם אימייל:', email);
        console.log('סיסמה שהתקבלה (אורך):', password?.length);

        // בדיקת משתמש קיים - נחפש לפי אימייל באותיות קטנות
        const user = await User.findOne({ email: email.toLowerCase() });
        
        console.log('משתמש נמצא:', user ? 'כן' : 'לא');
        if (user) {
            console.log('אורך הסיסמה המוצפנת:', user.password?.length);
        }

        if (!user) {
            console.log('משתמש לא נמצא עם האימייל:', email);
            return res.status(401).json({ message: 'אימייל או סיסמה שגויים' });
        }

        // וידוא שיש סיסמה
        if (!password) {
            console.log('לא התקבלה סיסמה');
            return res.status(401).json({ message: 'אימייל או סיסמה שגויים' });
        }

        // בדיקת סיסמה
        const isMatch = await bcrypt.compare(password, user.password);
        console.log('סיסמה שהוזנה:', password);
        console.log('סיסמה מוצפנת:', user.password);
        console.log('סיסמה תואמת:', isMatch ? 'כן' : 'לא');

        if (!isMatch) {
            console.log('סיסמה לא תואמת למשתמש:', email);
            return res.status(401).json({ message: 'אימייל או סיסמה שגויים' });
        }

        // יצירת טוקן
        const token = generateToken(user);

        // עדכון זמן התחברות אחרון
        user.lastLogin = Date.now();
        await user.save();

        console.log('התחברות מוצלחת:', user.email);

        res.json({
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                role: user.role
            }
        });

    } catch (error) {
        console.error('שגיאה בהתחברות:', error);
        res.status(500).json({ 
            message: 'שגיאה בהתחברות',
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};

// קבלת משתמש נוכחי
exports.getCurrentUser = async (req, res) => {
    try {
        const user = await User.findById(req.user.id)
            .select('-password');
        
        if (!user) {
            return res.status(404).json({ message: 'משתמש לא נמצא' });
        }

        res.json(user);
    } catch (error) {
        res.status(500).json({ 
            message: 'שגיאה בקבלת פרטי המשתמש',
            error: error.message 
        });
    }
};

// יצירת קוד קישור
exports.generateLinkCode = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        
        if (!user || user.role !== 'parent') {
            return res.status(403).json({
                message: 'רק משתמשים מסוג הורה יכולים ליצור קוד קישור'
            });
        }

        // יצירת קוד קישור אקראי
        const linkCode = Math.random().toString(36).substring(2, 8).toUpperCase();
        
        user.linkCode = linkCode;
        user.linkCodeExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // תוקף ל-24 שעות
        await user.save();

        res.json({ 
            linkCode,
            expiresAt: user.linkCodeExpires
        });
    } catch (error) {
        res.status(500).json({ 
            message: 'שגיאה ביצירת קוד קישור',
            error: error.message 
        });
    }
};

// קישור חשבונות
exports.linkAccounts = async (req, res) => {
    try {
        const { linkCode } = req.body;
        const childId = req.user.id;

        const parent = await User.findOne({
            linkCode,
            linkCodeExpires: { $gt: Date.now() },
            role: 'parent'
        });

        if (!parent) {
            return res.status(400).json({ message: 'קוד קישור לא תקין או פג תוקף' });
        }

        const child = await User.findById(childId);
        if (!child || child.role !== 'child') {
            return res.status(403).json({ message: 'רק משתמשים מסוג ילד יכולים להתשר להורה' });
        }

        // עדכון הקישור
        child.parentId = parent._id;
        await child.save();

        // ניקוי קוד הקישור
        parent.linkCode = undefined;
        parent.linkCodeExpires = undefined;
        await parent.save();

        res.json({
            message: 'החשבונות קושרו בהצלחה',
            parentId: parent._id
        });
    } catch (error) {
        res.status(500).json({ 
            message: 'שגיאה בקישור החשבונות',
            error: error.message 
        });
    }
};

// קבלת חשבונות מקושרים
exports.getLinkedAccounts = async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await User.findById(userId);

        let linkedAccounts = [];
        if (user.role === 'parent') {
            // קבלת כל הילדים המקושרים
            linkedAccounts = await User.find({ parentId: userId })
                .select('username role email lastLogin');
        } else if (user.parentId) {
            // קבלת ההורה המקושר
            const parent = await User.findById(user.parentId)
                .select('username role email lastLogin');
            if (parent) {
                linkedAccounts = [parent];
            }
        }

        res.json(linkedAccounts);
    } catch (error) {
        res.status(500).json({ 
            message: 'שגיאה בקבלת חשבונות מקושרים',
            error: error.message 
        });
    }
};

// עדכון משתמש
exports.updateUser = async (req, res) => {
    try {
        const { userId } = req.params;
        const updates = req.body;
        const currentUser = await User.findById(req.user.id);

        // בדיקת הרשאות
        if (currentUser.role !== 'parent' && currentUser._id.toString() !== userId) {
            return res.status(403).json({ message: 'אין הרשאה לעדכן משתמש זה' });
        }

        // הסרת שדות שלא ניתן לעדכן
        delete updates.password;
        delete updates.role;
        delete updates.email;

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { $set: updates },
            { new: true, runValidators: true }
        ).select('-password');

        if (!updatedUser) {
            return res.status(404).json({ message: 'משתמש לא נמצא' });
        }

        res.json({
            message: 'המשתמש עודכן בהצלחה',
            user: updatedUser
        });
    } catch (error) {
        res.status(500).json({ 
            message: 'שגיאה בעדכון המשתמש',
            error: error.message 
        });
    }
};

// הוסף את הפונקציה הזו בסוף הקובץ
exports.forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email: email.toLowerCase() });
        
        if (!user) {
            return res.status(404).json({ message: 'לא נמצא משתמש עם כתובת האימייל הזו' });
        }

        // יצירת טוקן לאיפוס סיסמה
        const resetToken = jwt.sign(
            { id: user._id },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        // שמירת הטוקן בדאטהבייס
        user.resetPasswordToken = resetToken;
        user.resetPasswordExpires = Date.now() + 3600000; // תוקף של שעה
        await user.save();

        // TODO: שליחת אימייל עם קישור לאיפוס סיסמה
        
        res.json({ 
            message: 'הוראות לאיפוס הסיסמה נשלחו לכתובת האימייל שלך',
            resetToken // בסביבת פיתוח בלבד
        });
    } catch (error) {
        console.error('שגיאה בתהליך שחזור הסיסמה:', error);
        res.status(500).json({ 
            message: 'שגיאה בתהליך שחזור הסיסמה',
            error: error.message 
        });
    }
};