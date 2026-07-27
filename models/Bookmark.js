const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Bookmark = sequelize.define('Bookmark', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  postId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
}, {
  timestamps: true,
  tableName: 'bookmarks',
  indexes: [
    {
      unique: true,
      fields: ['userId', 'postId'] // Prevents duplicate bookmarks from same user for same post
    }
  ]
});

module.exports = Bookmark;
