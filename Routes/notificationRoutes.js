const express = require('express');
const { Notification, Post } = require('../models');
const authenticateToken = require('../middleware/authMiddleware');

const router = express.Router();

// =============================================================
// GET /api/notifications
// Returns all notifications for the logged-in user (newest first)
// Also returns unreadCount for the bell badge
// =============================================================
router.get('/', authenticateToken, async (req, res) => {
  try {
    const notifications = await Notification.findAll({
      where: { userId: req.user.id },
      order: [['createdAt', 'DESC']],
      limit: 30, // Return last 30 notifications
    });

    const unreadCount = notifications.filter(n => !n.isRead).length;

    res.status(200).json({ notifications, unreadCount });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch notifications', error: error.message });
  }
});

// =============================================================
// PATCH /api/notifications/:id/read
// Mark a single notification as read
// =============================================================
router.patch('/:id/read', authenticateToken, async (req, res) => {
  try {
    const notification = await Notification.findOne({
      where: { id: req.params.id, userId: req.user.id }
    });

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    await notification.update({ isRead: true });
    res.status(200).json({ message: 'Notification marked as read' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to mark notification as read', error: error.message });
  }
});

// =============================================================
// POST /api/notifications/read-all
// Mark ALL notifications as read for current user
// =============================================================
router.post('/read-all', authenticateToken, async (req, res) => {
  try {
    await Notification.update(
      { isRead: true },
      { where: { userId: req.user.id, isRead: false } }
    );
    res.status(200).json({ message: 'All notifications marked as read' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to mark all notifications as read', error: error.message });
  }
});

// =============================================================
// DELETE /api/notifications/clear-all
// Clear (delete) all notifications for current user
// =============================================================
router.delete('/clear-all', authenticateToken, async (req, res) => {
  try {
    await Notification.destroy({ where: { userId: req.user.id } });
    res.status(200).json({ message: 'All notifications cleared' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to clear notifications', error: error.message });
  }
});

module.exports = router;
