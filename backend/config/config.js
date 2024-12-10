// backend/config/config.js
require('dotenv').config();

module.exports = {
    jwtSecret: process.env.JWT_SECRET || 'your-secret-key',
    jwtExpiration: '24h',
    mongoURI: process.env.MONGO_URI || 'mongodb://localhost:27017/family-budget',
    port: process.env.PORT || 5004
};