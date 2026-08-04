const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Notification = sequelize.define('Notification', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  // The user who receives this notification
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  // 'like' | 'comment' | 'announcement'
  type: {
    type: DataTypes.ENUM('like', 'comment', 'announcement'),
    allowNull: false,
  },
  // Human-readable message e.g. "Sara liked your post"
  message: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  // Which post this notification relates to (so we can link to it)
  postId: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  // Has the user read this notification?
  isRead: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
}, {
  timestamps: true,
  paranoid: true,
  tableName: 'notifications',
});

module.exports = Notification;
