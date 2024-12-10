const jwt = require('jsonwebtoken');
const Child = require('../models/Child');

const childAuth = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({ message: 'נדרש אימות' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const child = await Child.findById(decoded.id);

        if (!child) {
            return res.status(404).json({ message: 'הילד לא נמצא' });
        }

        req.child = child;
        next();
    } catch (error) {
        console.error('Error in childAuth middleware:', error);
        res.status(401).json({ message: 'נדרש אימות' });
    }
};

module.exports = childAuth;
