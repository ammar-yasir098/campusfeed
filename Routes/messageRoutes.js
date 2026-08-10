const express = require('express');
const { Op } = require('sequelize');
const { User, Conversation, DirectMessage } = require('../models');
const authenticateToken = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

const router = express.Router();

router.use(authenticateToken);

// Helper function to get or create a 1-on-1 conversation
async function getOrCreateConversation(userAId, userBId) {
    const u1 = Math.min(userAId, userBId);
    const u2 = Math.max(userAId, userBId);

    let conversation = await Conversation.findOne({
        where: { user1Id: u1, user2Id: u2 }
    });

    if (!conversation) {
        conversation = await Conversation.create({ user1Id: u1, user2Id: u2 });
    }

    return conversation;
}

// 1. GET /api/messages/conversations - List all conversations for current user
router.get('/conversations', async (req, res) => {
    try {
        const userId = req.user.id;

        const conversations = await Conversation.findAll({
            where: {
                [Op.or]: [{ user1Id: userId }, { user2Id: userId }]
            },
            order: [['lastMessageAt', 'DESC']],
            include: [
                {
                    model: User,
                    as: 'user1',
                    attributes: ['id', 'name', 'email', 'avatarUrl', 'role', 'status', 'isVerified', 'department']
                },
                {
                    model: User,
                    as: 'user2',
                    attributes: ['id', 'name', 'email', 'avatarUrl', 'role', 'status', 'isVerified', 'department']
                },
                {
                    model: DirectMessage,
                    as: 'messages',
                    limit: 1,
                    order: [['createdAt', 'DESC']],
                    include: [
                        { model: User, as: 'sender', attributes: ['id', 'name'] }
                    ]
                }
            ]
        });

        // Format conversation list with recipient info and unread badge count
        const formatted = await Promise.all(conversations.map(async (conv) => {
            const isUser1 = conv.user1Id === userId;
            const otherUser = isUser1 ? conv.user2 : conv.user1;
            const lastMsg = conv.messages && conv.messages.length > 0 ? conv.messages[0] : null;

            const unreadCount = await DirectMessage.count({
                where: {
                    conversationId: conv.id,
                    receiverId: userId,
                    isRead: false
                }
            });

            return {
                id: conv.id,
                otherUser,
                lastMessage: lastMsg ? {
                    id: lastMsg.id,
                    content: lastMsg.content,
                    imageUrl: lastMsg.imageUrl,
                    senderId: lastMsg.senderId,
                    senderName: lastMsg.sender ? lastMsg.sender.name : '',
                    createdAt: lastMsg.createdAt
                } : null,
                unreadCount,
                updatedAt: conv.lastMessageAt
            };
        }));

        res.status(200).json({ conversations: formatted });
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch conversations', error: error.message });
    }
});

// 2. GET /api/messages/conversations/:conversationId - Get message history for conversation
router.get('/conversations/:conversationId', async (req, res) => {
    try {
        const userId = req.user.id;
        const { conversationId } = req.params;

        const conversation = await Conversation.findByPk(conversationId, {
            include: [
                { model: User, as: 'user1', attributes: ['id', 'name', 'email', 'avatarUrl', 'role', 'status', 'isVerified', 'department'] },
                { model: User, as: 'user2', attributes: ['id', 'name', 'email', 'avatarUrl', 'role', 'status', 'isVerified', 'department'] }
            ]
        });

        if (!conversation || (conversation.user1Id !== userId && conversation.user2Id !== userId)) {
            return res.status(404).json({ message: 'Conversation not found or unauthorized' });
        }

        // Mark incoming unread messages as read
        await DirectMessage.update(
            { isRead: true },
            {
                where: {
                    conversationId: conversation.id,
                    receiverId: userId,
                    isRead: false
                }
            }
        );

        const messages = await DirectMessage.findAll({
            where: { conversationId: conversation.id },
            order: [['createdAt', 'ASC']],
            include: [
                { model: User, as: 'sender', attributes: ['id', 'name', 'email', 'avatarUrl'] }
            ]
        });

        const otherUser = conversation.user1Id === userId ? conversation.user2 : conversation.user1;

        res.status(200).json({
            conversationId: conversation.id,
            otherUser,
            messages
        });
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch messages', error: error.message });
    }
});

// 3. POST /api/messages/send - Send a Direct Message
router.post('/send', (req, res) => {
    upload.single('image')(req, res, async (err) => {
        if (err) {
            return res.status(400).json({ message: err.message });
        }

        try {
            const senderId = req.user.id;

            if (['banned', 'suspended', 'muted'].includes(req.user.status)) {
                return res.status(403).json({ message: `Your account is ${req.user.status}. You cannot send direct messages.` });
            }

            const { recipientId, content } = req.body;
            const targetRecipientId = parseInt(recipientId, 10);

            if (!targetRecipientId || isNaN(targetRecipientId)) {
                return res.status(400).json({ message: 'Recipient ID is required' });
            }

            if (targetRecipientId === senderId) {
                return res.status(400).json({ message: 'You cannot message yourself' });
            }

            const recipient = await User.findByPk(targetRecipientId);
            if (!recipient) {
                return res.status(404).json({ message: 'Recipient user not found' });
            }

            let imageUrl = null;
            if (req.file) {
                imageUrl = `uploads/${req.file.filename}`;
            }

            if (!content && !imageUrl) {
                return res.status(400).json({ message: 'Message content or image attachment is required' });
            }

            const conversation = await getOrCreateConversation(senderId, targetRecipientId);

            const newMessage = await DirectMessage.create({
                conversationId: conversation.id,
                senderId,
                receiverId: targetRecipientId,
                content: content || null,
                imageUrl,
                isRead: false
            });

            await conversation.update({ lastMessageAt: new Date() });

            const messageWithSender = await DirectMessage.findByPk(newMessage.id, {
                include: [
                    { model: User, as: 'sender', attributes: ['id', 'name', 'email', 'avatarUrl'] }
                ]
            });

            // Emit live real-time Socket event if socket IO helper is available
            const io = req.app.get('io');
            if (io) {
                io.to(`user_${targetRecipientId}`).to(`user_${senderId}`).emit('new_direct_message', messageWithSender);

                // Fetch updated unread count for recipient
                const recipientUnreadCount = await DirectMessage.count({
                    where: { receiverId: targetRecipientId, isRead: false }
                });
                io.to(`user_${targetRecipientId}`).emit('unread_dm_count', { unreadCount: recipientUnreadCount });
            }

            res.status(201).json({ message: messageWithSender, conversationId: conversation.id });
        } catch (error) {
            res.status(500).json({ message: 'Failed to send message', error: error.message });
        }
    });
});

// 4. GET /api/messages/unread-count - Fetch total unread DM count
router.get('/unread-count', async (req, res) => {
    try {
        const unreadCount = await DirectMessage.count({
            where: { receiverId: req.user.id, isRead: false }
        });
        res.status(200).json({ unreadCount });
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch unread count', error: error.message });
    }
});

// 5. GET /api/messages/search-users - Search students to message
router.get('/search-users', async (req, res) => {
    try {
        const { q } = req.query;
        if (!q || !q.trim()) {
            return res.status(200).json({ users: [] });
        }

        const queryTerm = q.trim();
        const users = await User.findAll({
            where: {
                id: { [Op.ne]: req.user.id },
                [Op.or]: [
                    { name: { [Op.iLike]: `%${queryTerm}%` } },
                    { email: { [Op.iLike]: `%${queryTerm}%` } },
                    { department: { [Op.iLike]: `%${queryTerm}%` } }
                ]
            },
            attributes: ['id', 'name', 'email', 'avatarUrl', 'role', 'status', 'isVerified', 'department'],
            limit: 10
        });

        res.status(200).json({ users });
    } catch (error) {
        res.status(500).json({ message: 'Failed to search users', error: error.message });
    }
});

module.exports = router;
