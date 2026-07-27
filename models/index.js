const User = require('./User');
const Post = require('./Post');
const Like = require('./Like');
const Comment = require('./Comment');
const Bookmark = require('./Bookmark');

// User & Post Associations
User.hasMany(Post, { foreignKey: 'userId', as: 'posts', onDelete: 'CASCADE' });
Post.belongsTo(User, { foreignKey: 'userId', as: 'author' });

// User & Like Associations
User.hasMany(Like, { foreignKey: 'userId', as: 'likes', onDelete: 'CASCADE' });
Like.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// Post & Like Associations
Post.hasMany(Like, { foreignKey: 'postId', as: 'likes', onDelete: 'CASCADE' });
Like.belongsTo(Post, { foreignKey: 'postId', as: 'post' });

// User & Comment Associations
User.hasMany(Comment, { foreignKey: 'userId', as: 'comments', onDelete: 'CASCADE' });
Comment.belongsTo(User, { foreignKey: 'userId', as: 'author' });

// Post & Comment Associations
Post.hasMany(Comment, { foreignKey: 'postId', as: 'comments', onDelete: 'CASCADE' });
Comment.belongsTo(Post, { foreignKey: 'postId', as: 'post' });

// User & Bookmark Associations
User.hasMany(Bookmark, { foreignKey: 'userId', as: 'bookmarks', onDelete: 'CASCADE' });
Bookmark.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// Post & Bookmark Associations
Post.hasMany(Bookmark, { foreignKey: 'postId', as: 'bookmarks', onDelete: 'CASCADE' });
Bookmark.belongsTo(Post, { foreignKey: 'postId', as: 'post' });

module.exports = {
  User,
  Post,
  Like,
  Comment,
  Bookmark,
};
