const User = require('./User');
const Post = require('./Post');
const Like = require('./Like');
const Comment = require('./Comment');
const Bookmark = require('./Bookmark');
const Poll = require('./Poll');
const PollOption = require('./PollOption');
const PollVote = require('./PollVote');
const Notification = require('./Notification');
const Report = require('./Report');
const PostImage = require('./PostImage');

// User & Post Associations
User.hasMany(Post, { foreignKey: 'userId', as: 'posts', onDelete: 'CASCADE' });
Post.belongsTo(User, { foreignKey: 'userId', as: 'author' });

// Post & PostImage Associations
Post.hasMany(PostImage, { foreignKey: 'postId', as: 'images', onDelete: 'CASCADE' });
PostImage.belongsTo(Post, { foreignKey: 'postId', as: 'post' });

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

// Post & Poll Associations
Post.hasOne(Poll, { foreignKey: 'postId', as: 'poll', onDelete: 'CASCADE' });
Poll.belongsTo(Post, { foreignKey: 'postId', as: 'post' });

// Poll & PollOption Associations
Poll.hasMany(PollOption, { foreignKey: 'pollId', as: 'options', onDelete: 'CASCADE' });
PollOption.belongsTo(Poll, { foreignKey: 'pollId', as: 'poll' });

// Poll & PollVote Associations
Poll.hasMany(PollVote, { foreignKey: 'pollId', as: 'votes', onDelete: 'CASCADE' });
PollVote.belongsTo(Poll, { foreignKey: 'pollId', as: 'poll' });

// PollOption & PollVote Associations
PollOption.hasMany(PollVote, { foreignKey: 'optionId', as: 'votes', onDelete: 'CASCADE' });
PollVote.belongsTo(PollOption, { foreignKey: 'optionId', as: 'option' });

// User & PollVote Associations
User.hasMany(PollVote, { foreignKey: 'userId', as: 'pollVotes', onDelete: 'CASCADE' });
PollVote.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// User & Notification Associations
User.hasMany(Notification, { foreignKey: 'userId', as: 'notifications', onDelete: 'CASCADE' });
Notification.belongsTo(User, { foreignKey: 'userId', as: 'recipient' });

// Post & Notification Associations (so if post is deleted, notifications are also deleted)
Post.hasMany(Notification, { foreignKey: 'postId', as: 'notifications', onDelete: 'CASCADE' });
Notification.belongsTo(Post, { foreignKey: 'postId', as: 'post' });

// Post & Report Associations
Post.hasMany(Report, { foreignKey: 'postId', as: 'reports', onDelete: 'CASCADE' });
Report.belongsTo(Post, { foreignKey: 'postId', as: 'post' });

// User & Report Associations (reporter)
const Conversation = require('./Conversation');
const DirectMessage = require('./DirectMessage');

// Conversation & User Associations
Conversation.belongsTo(User, { foreignKey: 'user1Id', as: 'user1' });
Conversation.belongsTo(User, { foreignKey: 'user2Id', as: 'user2' });
User.hasMany(Conversation, { foreignKey: 'user1Id', as: 'startedConversations' });
User.hasMany(Conversation, { foreignKey: 'user2Id', as: 'receivedConversations' });

// Conversation & DirectMessage Associations
Conversation.hasMany(DirectMessage, { foreignKey: 'conversationId', as: 'messages', onDelete: 'CASCADE' });
DirectMessage.belongsTo(Conversation, { foreignKey: 'conversationId', as: 'conversation' });

// DirectMessage & User Associations
DirectMessage.belongsTo(User, { foreignKey: 'senderId', as: 'sender' });
DirectMessage.belongsTo(User, { foreignKey: 'receiverId', as: 'receiver' });
User.hasMany(DirectMessage, { foreignKey: 'senderId', as: 'sentMessages', onDelete: 'CASCADE' });
User.hasMany(DirectMessage, { foreignKey: 'receiverId', as: 'receivedMessages', onDelete: 'CASCADE' });

module.exports = {
  User,
  Post,
  Like,
  Comment,
  Bookmark,
  Poll,
  PollOption,
  PollVote,
  Notification,
  Report,
  PostImage,
  Conversation,
  DirectMessage,
};



