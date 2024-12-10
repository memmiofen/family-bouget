const express = require('express');
const mongoose = require('mongoose');
const http = require('http');
require('dotenv').config();

const app = express();
const cors = require('cors');
const server = http.createServer(app);
const authRoutes = require('./routes/auth');
const dashboardRoutes = require('./routes/dashboard');
const connectDB = require('./db/index');
const incomeRoutes = require('./routes/income');
const expenseRoutes = require('./routes/expenseRoutes');
const childRoutes = require('./routes/childRoutes');
const parentRoutes = require('./routes/parentRoutes');

app.use(express.json()); // Middleware to parse JSON bodies

const allowedOrigins = [
    process.env.CLIENT_URL || 'http://localhost:3000',
    'http://localhost:3001'
];

app.use(cors({
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
}));

// נתיבים
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/income', incomeRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/children', childRoutes);
app.use('/api/parents', parentRoutes);
console.log("fffff",process.env.MONGO_URI);

connectDB();

// Start the server
const PORT = process.env.PORT || 5004;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});