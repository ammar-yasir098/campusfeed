const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Report = sequelize.define('Report', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  postId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  reporterId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  reason: {
    type: DataTypes.ENUM('Spam', 'Harassment', 'Misinformation', 'Inappropriate Content'),
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('pending', 'dismissed', 'actioned'),
    defaultValue: 'pending',
  },
}, {
  timestamps: true,
  tableName: 'reports',
});

module.exports = Report;
