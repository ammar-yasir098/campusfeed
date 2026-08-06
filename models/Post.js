const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Post = sequelize.define('Post', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  category: {
    type: DataTypes.ENUM('General', 'Announcements', 'Events', 'Lost & Found', 'Buy & Sell'),
    defaultValue: 'General',
  },
  imageUrl: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  videoUrl: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  isTakedown: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  takedownReason: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  takedownByAdmin: {
    type: DataTypes.STRING,
    allowNull: true,
  },
}, {
  timestamps: true,
  tableName: 'posts',
});

module.exports = Post;
