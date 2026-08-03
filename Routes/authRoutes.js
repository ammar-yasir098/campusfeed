const express = require('express');
const bcrypt = require('bcrypt');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const authenticateToken = require('../middleware/authMiddleware');
const validate = require('../middleware/validate');
const { signupValidation, loginValidation } = require('../middleware/validators');

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: process.env.NODE_ENV === 'production' ? 5 : 20, // Allow up to 20 attempts in dev/testing
    message: { message: 'Too many login attempts from this IP. Please try again in 15 mins.' },
    standardHeaders: true,
    legacyHeaders: false,
});

const router = express.Router();

router.post('/signup', signupValidation, validate, async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ message: 'Name, email, and password are required' });
        }

        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists with this email' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const clientIp = (req.headers['x-forwarded-for'] || req.ip || req.socket.remoteAddress || '').toString().split(',')[0].trim();

        // If this is the first user ever registered in DB, make them an admin for easy setup
        const userCount = await User.count();
        const initialRole = userCount === 0 ? 'admin' : 'user';

        const newUser = await User.create({
            name,
            email,
            password: hashedPassword,
            role: initialRole,
            status: 'active',
            isVerified: initialRole === 'admin',
            lastLoginIp: clientIp
        });

        res.status(201).json({
            message: 'User created successfully',
            user: {
                id: newUser.id,
                name: newUser.name,
                email: newUser.email,
                role: newUser.role,
                status: newUser.status,
                isVerified: newUser.isVerified,
                createdAt: newUser.createdAt
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Signup failed', error: error.message });
    }
});

router.post('/login', loginLimiter, loginValidation, validate, async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }

        const user = await User.findOne({ where: { email } });
        if (!user) {
            return res.status(401).json({ message: 'Invalid username or password' });
        }

        if (user.status === 'banned' || user.status === 'suspended') {
            return res.status(403).json({ message: `Your account is ${user.status}. Please contact university support.` });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid username or password' });
        }

        const clientIp = (req.headers['x-forwarded-for'] || req.ip || req.socket.remoteAddress || '').toString().split(',')[0].trim();
        await user.update({ lastLoginIp: clientIp });

        const token = jwt.sign(
            { userId: user.id },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.status(200).json({
            message: 'Login successful!',
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                status: user.status,
                isVerified: user.isVerified,
                studentId: user.studentId,
                department: user.department,
                bio: user.bio,
                avatarUrl: user.avatarUrl,
                lastLoginIp: user.lastLoginIp
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Login failed', error: error.message });
    }
});

// Protected route to fetch current authenticated user profile
router.get('/me', authenticateToken, (req, res) => {
    res.status(200).json({ user: req.user });
});

module.exports = router;