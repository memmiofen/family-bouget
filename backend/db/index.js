const mongoose = require('mongoose');
const config = require('../config/config');

const connectDB = async () => {
    try {
        console.log('מנסה להתחבר למונגו עם URI:', 
            config.mongoURI.replace(/\/\/([^:]+):([^@]+)@/, '//****:****@') // מסתיר פרטי התחברות רגישים
        );
        
        const conn = await mongoose.connect(config.mongoURI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        
        console.log('=== מידע על החיבור למונגו ===');
        console.log(`שרת מונגו: ${conn.connection.host}`);
        console.log(`שם דאטהבייס: ${conn.connection.name}`);
        console.log(`מצב חיבור: ${conn.connection.readyState === 1 ? 'מחובר' : 'לא מחובר'}`);
        
        // בדיקת קולקציות
        const collections = await mongoose.connection.db.listCollections().toArray();
        console.log('קולקציות קיימות:', collections.map(c => c.name));
        
        // בדיקת מודל המשתמשים
        try {
            const User = mongoose.model('User');
            const userCount = await User.countDocuments();
            console.log(`נמצאו ${userCount} משתמשים במערכת`);
            
            // מציג את המשתמש האחרון שנוסף
            if (userCount > 0) {
                const lastUser = await User.findOne({}, { password: 0 }).sort({ _id: -1 });
                console.log('המשתמש האחרון שנוסף:', {
                    id: lastUser._id,
                    username: lastUser.username,
                    email: lastUser.email,
                    createdAt: lastUser._id.getTimestamp()
                });
            }
        } catch (userError) {
            console.error('שגיאה בבדיקת משתמשים:', userError);
        }
        
    } catch (error) {
        console.error('שגיאה בהתחברות למסד הנתונים:', {
            message: error.message,
            name: error.name,
            code: error.code
        });
        process.exit(1);
    }
};

// האזנה לאירועי מונגו
mongoose.connection.on('error', err => {
    console.error('MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
    console.log('MongoDB disconnected');
});

mongoose.connection.on('connected', () => {
    console.log('MongoDB connected');
});

module.exports = connectDB;