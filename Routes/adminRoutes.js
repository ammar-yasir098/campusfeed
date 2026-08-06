const express = require('express');
const { Op } = require('sequelize');
const { User, Post, Report, PostImage } = require('../models');
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
                { email: { [Op.iLike]: `%${queryTerm}%` } },
                { name: { [Op.iLike]: `%${queryTerm}%` } },
                { lastLoginIp: { [Op.iLike]: `%${queryTerm}%` } }
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

// 5. GET /api/admin/reports - Fetch all pending reported posts (grouped by postId + individual list)
router.get('/reports', async (req, res) => {
    try {
        const reports = await Report.findAll({
            where: { status: 'pending' },
            order: [['createdAt', 'DESC']],
            include: [
                {
                    model: Post,
                    as: 'post',
                    include: [
                        {
                            model: User,
                            as: 'author',
                            attributes: ['id', 'name', 'email', 'avatarUrl', 'role', 'status']
                        },
                        {
                            model: PostImage,
                            as: 'images',
                            attributes: ['id', 'imageUrl', 'orderIndex']
                        }
                    ]
                },
                {
                    model: User,
                    as: 'reporter',
                    attributes: ['id', 'name', 'email', 'avatarUrl']
                }
            ]
        });

        const pendingCount = reports.length;

        // Group reports by postId
        const groupedMap = {};
        reports.forEach(report => {
            if (!report.postId || !report.post) return;
            const postJson = report.post.toJSON ? report.post.toJSON() : report.post;
            if (postJson.images && Array.isArray(postJson.images) && postJson.images.length > 0) {
                postJson.imageUrls = postJson.images.sort((a,b) => a.orderIndex - b.orderIndex).map(i => i.imageUrl);
            } else if (postJson.imageUrl) {
                postJson.imageUrls = [postJson.imageUrl];
            } else {
                postJson.imageUrls = [];
            }

            if (!groupedMap[report.postId]) {
                groupedMap[report.postId] = {
                    postId: report.postId,
                    post: postJson,
                    reportCount: 0,
                    reporters: []
                };
            }
            groupedMap[report.postId].reportCount += 1;
            groupedMap[report.postId].reporters.push({
                reportId: report.id,
                reason: report.reason,
                reporter: report.reporter,
                createdAt: report.createdAt
            });
        });

        const groupedReports = Object.values(groupedMap);

        res.status(200).json({
            pendingCount,
            uniquePostsCount: groupedReports.length,
            groupedReports,
            reports
        });
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch reported posts queue', error: error.message });
    }
});

// 6. POST /api/admin/reports/:id/dismiss - Dismiss a single report notice
router.post('/reports/:id/dismiss', async (req, res) => {
    try {
        const reportId = req.params.id;

        const report = await Report.findByPk(reportId);
        if (!report) {
            return res.status(404).json({ message: 'Report notice not found' });
        }

        await report.update({ status: 'dismissed' });

        res.status(200).json({
            message: 'Report notice dismissed successfully',
            report
        });
    } catch (error) {
        res.status(500).json({ message: 'Failed to dismiss report notice', error: error.message });
    }
});

// 7. POST /api/admin/reports/post/:postId/dismiss - Dismiss ALL pending reports for a post
router.post('/reports/post/:postId/dismiss', async (req, res) => {
    try {
        const { postId } = req.params;

        const [updatedCount] = await Report.update(
            { status: 'dismissed' },
            { where: { postId, status: 'pending' } }
        );

        res.status(200).json({
            message: `All ${updatedCount} report notices for post #${postId} dismissed successfully`,
            dismissedCount: updatedCount
        });
    } catch (error) {
        res.status(500).json({ message: 'Failed to dismiss post reports', error: error.message });
    }
});

module.exports = router;
