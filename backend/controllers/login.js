const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { User, Investor, safeExecute } = require('./database/database');
require('dotenv').config();

class AuthSystem {
    // Initialize JWT secret key
    static JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
    static TOKEN_EXPIRY = '24h';

    // Generate JWT token
    static generateToken(userId, username) {
        return jwt.sign(
            { userId, username },
            this.JWT_SECRET,
            { expiresIn: this.TOKEN_EXPIRY }
        );
    }

    // Verify JWT token
    static verifyToken(token) {
        try {
            return jwt.verify(token, this.JWT_SECRET);
        } catch (error) {
            throw new Error('Invalid token');
        }
    }

    //TODO: move all functionalities and logic to /backend/routs and update the server with app.use(routName, './[PATH]') 
    // Register new user
    static async registerUser(username, password, email) {
        return await safeExecute(async () => {
            // Check if user exists
            const existingUser = await User.findOne({ username });
            if (existingUser) {
                throw new Error('Username already exists');
            }

            // Hash password
            const saltRounds = 10;
            const hashedPassword = await bcrypt.hash(password, saltRounds);

            // Create user
            const user = await User.create({
                username,
                password: hashedPassword,
                email,
                status: 'active'
            });

            // Create corresponding investor profile
            await Investor.create({
                userId: user._id,
                name: username
            });

            // Generate token
            const token = this.generateToken(user._id, username);

            return {
                message: 'User registered successfully',
                token,
                userId: user._id,
                username: user.username
            };
        }, 'Registration failed');
    }

    // Login user
    static async loginUser(username, password) {
        return await safeExecute(async () => {
            // Find user
            const user = await User.findOne({ username });
            if (!user) {
                throw new Error('User not found');
            }

            // Check if user is active
            if (user.status !== 'active') {
                throw new Error('Account is not active');
            }

            // Verify password
            const validPassword = await bcrypt.compare(password, user.password);
            if (!validPassword) {
                throw new Error('Invalid password');
            }

            // Update last login
            await User.updateOne(
                { _id: user._id },
                { 
                    $set: { 
                        lastLogin: new Date() 
                    }
                }
            );

            // Get investor details
            const investor = await Investor.findOne({ userId: user._id });

            // Generate token
            const token = this.generateToken(user._id, username);

            return {
                token,
                userId: user._id,
                username: user.username,
                investorId: investor._id,
                investorName: investor.name
            };
        }, 'Login failed');
    }

    // Change password
    static async changePassword(userId, currentPassword, newPassword) {
        return await safeExecute(async () => {
            const user = await User.findById(userId);
            if (!user) {
                throw new Error('User not found');
            }

            // Verify current password
            const validPassword = await bcrypt.compare(currentPassword, user.password);
            if (!validPassword) {
                throw new Error('Current password is incorrect');
            }

            // Hash new password
            const saltRounds = 10;
            const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

            // Update password
            await User.updateOne(
                { _id: userId },
                { $set: { password: hashedPassword } }
            );

            return { message: 'Password updated successfully' };
        }, 'Password change failed');
    }

    // Get user profile
    static async getUserProfile(userId) {
        return await safeExecute(async () => {
            const user = await User.findById(userId).select('-password');
            if (!user) {
                throw new Error('User not found');
            }

            const investor = await Investor.findOne({ userId: user._id });

            return {
                user: {
                    username: user.username,
                    email: user.email,
                    status: user.status,
                    createdAt: user.createdAt,
                    lastLogin: user.lastLogin
                },
                investor: {
                    name: investor.name,
                    balance: investor.balance,
                    preferences: investor.preferences
                }
            };
        }, 'Failed to fetch user profile');
    }

    // Update user profile
    static async updateUserProfile(userId, updates) {
        return await safeExecute(async () => {
            const allowedUpdates = ['email', 'preferences'];
            const updateData = {};
            const investorUpdateData = {};

            Object.keys(updates).forEach(key => {
                if (allowedUpdates.includes(key)) {
                    if (key === 'preferences') {
                        investorUpdateData[key] = updates[key];
                    } else {
                        updateData[key] = updates[key];
                    }
                }
            });

            if (Object.keys(updateData).length > 0) {
                await User.updateOne(
                    { _id: userId },
                    { $set: updateData }
                );
            }

            if (Object.keys(investorUpdateData).length > 0) {
                await Investor.updateOne(
                    { userId },
                    { $set: investorUpdateData }
                );
            }

            return { message: 'Profile updated successfully' };
        }, 'Profile update failed');
    }

    // Authentication middleware
    static authenticate(req, res, next) {
        try {
            const token = req.headers.authorization?.split(' ')[1];
            if (!token) {
                throw new Error('No token provided');
            }

            const decoded = this.verifyToken(token);
            req.user = decoded;
            next();
        } catch (error) {
            res.status(401).json({ error: 'Authentication failed' });
        }
    }
}

module.exports = AuthSystem;