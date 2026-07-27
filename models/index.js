const User = require('./User');
const Post = require('./Post');

// Establish associations
User.hasMany(Post, { foreignKey: 'userId', as: 'posts', onDelete: 'CASCADE' });
Post.belongsTo(User, { foreignKey: 'userId', as: 'author' });

module.exports = {
  User,
  Post,
};
