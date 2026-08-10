const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const { User, DirectMessage, Conversation } = require('../models');

function initSocket(server) {
    const io = new Server(server, {
        cors: {
            origin: process.env.FRONTEND_URL || 'http://localhost:5173',
            credentials: true
        }
    });

    // Authentication middleware for Socket.io
    io.use((socket, next) => {
        try {
            const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1];
            if (!token) {
                return next(new Error('Authentication token required'));
            }

            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            socket.userId = decoded.userId;
            next();
        } catch (err) {
            next(new Error('Invalid socket connection token'));
        }
    });

    io.on('connection', (socket) => {
        const userId = socket.userId;
        console.log(`⚡ Socket connected: User #${userId} (socket.id: ${socket.id})`);

        // Join personal user room for direct event targeting
        socket.join(`user_${userId}`);

        // Typing Indicators
        socket.on('typing_start', ({ recipientId, conversationId }) => {
            if (recipientId) {
                socket.to(`user_${recipientId}`).emit('user_typing', {
                    userId,
                    conversationId
                });
            }
        });

        socket.on('typing_stop', ({ recipientId, conversationId }) => {
            if (recipientId) {
                socket.to(`user_${recipientId}`).emit('user_stopped_typing', {
                    userId,
                    conversationId
                });
            }
        });

        // Mark Messages as Read Event
        socket.on('mark_read', async ({ conversationId, senderId }) => {
            try {
                await DirectMessage.update(
                    { isRead: true },
                    {
                        where: {
                            conversationId,
                            receiverId: userId,
                            senderId,
                            isRead: false
                        }
                    }
                );

                const unreadCount = await DirectMessage.count({
                    where: { receiverId: userId, isRead: false }
                });

                socket.emit('unread_dm_count', { unreadCount });
            } catch (err) {
                console.error('Failed to mark read via socket:', err.message);
            }
        });

        socket.on('disconnect', () => {
            console.log(`🔌 Socket disconnected: User #${userId}`);
        });
    });

    return io;
}

module.exports = initSocket;
