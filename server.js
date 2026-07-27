const express = require('express');
const cors = require('cors');
require('dotenv').config();

const sequelize = require('./config/database');
require('./models'); // Imports models and associations (User, Post, Like, Comment)

const authRoutes = require('./Routes/authRoutes');
const postRoutes = require('./Routes/postRoutes');
const userRoutes = require('./Routes/userRoutes');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/users', userRoutes);

app.get('/', (req, res) => {
  res.send('CampusFeed backend is running!');
});

const PORT = process.env.PORT || 5000;

sequelize.authenticate()
  .then(() => {
    console.log('PostgreSQL database connected via Sequelize.');
    return sequelize.sync({ alter: true });
  })
  .then(() => {
    console.log('Database models synchronized.');
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('PostgreSQL connection error:', err.message);
  });