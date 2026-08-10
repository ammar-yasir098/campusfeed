const express = require('express');
const http = require('http');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const sequelize = require('./config/database');
require('./models'); // Imports models and associations (User, Post, Like, Comment, Bookmark, Conversation, DirectMessage)
const initSocket = require('./config/socket');

const authRoutes = require('./Routes/authRoutes');
const postRoutes = require('./Routes/postRoutes');
const userRoutes = require('./Routes/userRoutes');
const uploadRoutes = require('./Routes/uploadRoutes');
const adminRoutes = require('./Routes/adminRoutes');
const notificationRoutes = require('./Routes/notificationRoutes');
const messageRoutes = require('./Routes/messageRoutes');

const app = express();
const server = http.createServer(app);

// Initialize Socket.io and attach to express app
const io = initSocket(server);
app.set('io', io);

// CORS — only allow configured frontend origin
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());

// Serve static uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Mount API routes
app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/users', userRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/messages', messageRoutes);

app.get('/', (req, res) => {
  res.send('CampusFeed backend is running!');
});

const PORT = process.env.PORT || 5000;

// Sequelize sync: alter:true only in development to avoid accidental data loss in production
const isProduction = process.env.NODE_ENV === 'production';
const syncOptions = isProduction ? {} : { alter: true };

sequelize.authenticate()
  .then(() => {
    console.log('PostgreSQL database connected via Sequelize.');
    return sequelize.sync(syncOptions);
  })
  .then(() => {
    console.log(`Database models synchronized. (mode: ${isProduction ? 'production — no alter' : 'development — alter:true'})`);
    server.listen(PORT, () => {
      console.log(`Server running with Socket.io on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('PostgreSQL connection error:', err.message);
  });