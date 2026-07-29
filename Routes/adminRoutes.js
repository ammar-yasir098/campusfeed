const express = require('express');
const { Op } = require('sequelize');
const User = require('../models/User');
const authenticateToken = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');

const router = express.Router();

// Apply authentication and admin check to all admin routes
router.use(authenticateToken);
router.use(adminMiddleware);

// 1. GET /api/admin/users - Search and list users by ID, Email, IP Address, or Name
router.get('/users', async (req, res) => {
    try {
        const { q, status } = req.query;

        let whereClause = {};

        if (status && status !== 'all') {
            whereClause.status = status;
        }

        if (q && q.trim() !== '') {
            const queryTerm = q.trim();
            const isNumeric = !isNaN(queryTerm);

            const searchConditions = [
                { email: { [Op.iLike || Op.like]: `%${queryTerm}%` } },
                { name: { [Op.iLike || Op.like]: `%${queryTerm}%` } },
                { lastLoginIp: { [Op.iLike || Op.like]: `%${queryTerm}%` } }
            ];

            if (isNumeric) {
                searchConditions.push({ id: parseInt(queryTerm, 10) });
            }

            whereClause[Op.or] = searchConditions;
        }

        const users = await User.findAll({
            where: whereClause,
            attributes: { exclude: ['password'] },
            order: [['createdAt', 'DESC']]
        });

        // Overview stats
        const totalUsers = await User.count();
        const activeUsers = await User.count({ where: { status: 'active' } });
        const bannedUsers = await User.count({ where: { status: 'banned' } });
        const suspendedUsers = await User.count({ where: { status: 'suspended' } });
        const verifiedUsers = await User.count({ where: { isVerified: true } });

        res.status(200).json({
            users,
            stats: {
                totalUsers,
                activeUsers,
                bannedUsers,
                suspendedUsers,
                verifiedUsers
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch admin users list', error: error.message });
    }
});

// 2. PUT /api/admin/users/:id/status - Change user account status (Ban, Suspend, Mute, Shadowban, Active)
router.post('/users/:id/status', async (req, res) => {
    try {
        const userId = req.params.id;
        const { status } = req.body;

        const validStatuses = ['active', 'suspended', 'banned', 'muted', 'shadowbanned'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ message: `Invalid status. Allowed values: ${validStatuses.join(', ')}` });
        }

        const targetUser = await User.findByPk(userId);
        if (!targetUser) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Prevent self-demotion or self-banning by accident
        if (targetUser.id === req.user.id && (status === 'banned' || status === 'suspended')) {
            return res.status(400).json({ message: 'You cannot ban or suspend your own admin account.' });
        }

        await targetUser.update({ status });

        res.status(200).json({
            message: `User status updated to ${status}`,
            user: {
                id: targetUser.id,
                name: targetUser.name,
                email: targetUser.email,
                status: targetUser.status
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Failed to update user status', error: error.message });
    }
});

// 3. PUT /api/admin/users/:id/verify - Toggle or manual approval for verified accounts / blue checks
router.post('/users/:id/verify', async (req, res) => {
    try {
        const userId = req.params.id;
        const { isVerified } = req.body;

        const targetUser = await User.findByPk(userId);
        if (!targetUser) {
            return res.status(404).json({ message: 'User not found' });
        }

        const nextVerified = isVerified !== undefined ? Boolean(isVerified) : !targetUser.isVerified;
        await targetUser.update({ isVerified: nextVerified });

        res.status(200).json({
            message: `User verification updated to ${nextVerified}`,
            user: {
                id: targetUser.id,
                name: targetUser.name,
                email: targetUser.email,
                isVerified: targetUser.isVerified
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Failed to update user verification', error: error.message });
    }
});

// 4. PUT /api/admin/users/:id/role - Toggle Admin role
router.post('/users/:id/role', async (req, res) => {
    try {
        const userId = req.params.id;
        const { role } = req.body;

        if (!['user', 'admin'].includes(role)) {
            return res.status(400).json({ message: 'Invalid role. Must be user or admin.' });
        }

        const targetUser = await User.findByPk(userId);
        if (!targetUser) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (targetUser.id === req.user.id && role !== 'admin') {
            return res.status(400).json({ message: 'You cannot remove your own admin role.' });
        }

        await targetUser.update({ role });

        res.status(200).json({
            message: `User role updated to ${role}`,
            user: {
                id: targetUser.id,
                name: targetUser.name,
                email: targetUser.email,
                role: targetUser.role
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Failed to update user role', error: error.message });
    }
});

module.exports = router;
