const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authenticateToken = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1]; // Extract token from "Bearer <token>"

        if (!token) {
            return res.status(401).json({ message: 'Access denied. No token provided.' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Fetch user from DB to verify user still exists (excluding password)
        const user = await User.findByPk(decoded.userId, {
            attributes: { exclude: ['password'] }
        });

        if (!user) {
            return res.status(401).json({ message: 'Invalid token. User no longer exists.' });
        }

        if (user.status === 'banned' || user.status === 'suspended') {
            return res.status(403).json({ message: `Account is ${user.status}. Please contact university administration.` });
        }

        req.user = user; // Attach user instance to request object
        next();
    } catch (error) {
        return res.status(403).json({ message: 'Invalid or expired token', error: error.message });
    }
};

module.exports = authenticateToken;
