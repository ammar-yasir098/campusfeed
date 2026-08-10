const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Conversation = sequelize.define('Conversation', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  user1Id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  user2Id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  lastMessageAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  timestamps: true,
  tableName: 'conversations',
  indexes: [
    {
      unique: true,
      fields: ['user1Id', 'user2Id'],
    },
  ],
});

module.exports = Conversation;
