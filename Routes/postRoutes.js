const express = require('express');
const { Post, User, Like, Comment, Bookmark } = require('../models');
const authenticateToken = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

const router = express.Router();

// CREATE a new post (Protected - Stores path "uploads/filename")
router.post('/', authenticateToken, (req, res) => {
    upload.single('image')(req, res, async (err) => {
        if (err) {
            return res.status(400).json({ message: err.message });
        }
        try {
            const { title, content, category } = req.body;
            let imageUrl = req.body ? req.body.imageUrl : null;

            if (req.file) {
                imageUrl = `uploads/${req.file.filename}`;
            }

            if (!title || !content) {
                return res.status(400).json({ message: 'Title and content are required' });
            }

            const newPost = await Post.create({
                title,
                content,
                category: category || 'General',
                imageUrl: imageUrl || null,
                userId: req.user.id
            });

            // Fetch created post with author details included
            const postWithAuthor = await Post.findByPk(newPost.id, {
                include: [{
                    model: User,
                    as: 'author',
                    attributes: ['id', 'name', 'email', 'avatarUrl']
                }]
            });

            res.status(201).json({
                message: 'Post created successfully',
                post: postWithAuthor
            });
        } catch (error) {
            res.status(500).json({ message: 'Failed to create post', error: error.message });
        }
    });
});

// GET all posts (Public feed with author info, like count, comment count, category filter, limit & offset pagination)
router.get('/', async (req, res) => {
    try {
        const { category, limit: queryLimit, offset: queryOffset } = req.query;
        const whereClause = {};

        if (category && category !== 'All') {
            whereClause.category = category;
        }

        const limit = queryLimit ? parseInt(queryLimit, 10) : undefined;
        const offset = queryOffset ? parseInt(queryOffset, 10) : undefined;

        const totalPosts = await Post.count({ where: whereClause });

        const posts = await Post.findAll({
            where: whereClause,
            order: [['createdAt', 'DESC']],
            limit,
            offset,
            include: [
                {
                    model: User,
                    as: 'author',
                    attributes: ['id', 'name', 'email', 'avatarUrl']
                },
                {
                    model: Like,
                    as: 'likes',
                    attributes: ['id', 'userId']
                },
                {
                    model: Comment,
                    as: 'comments',
                    attributes: ['id']
                }
            ]
        });

        const formattedPosts = posts.map(post => {
            const json = post.toJSON();
            json.likeCount = json.likes ? json.likes.length : 0;
            json.commentCount = json.comments ? json.comments.length : 0;
            delete json.comments; // Remove bare comments array to force full fetching on expand
            return json;
        });

        const currentOffset = offset || 0;
        const hasMore = currentOffset + formattedPosts.length < totalPosts;

        res.status(200).json({
            total: totalPosts,
            count: formattedPosts.length,
            hasMore,
            posts: formattedPosts
        });
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch posts', error: error.message });
    }
});

// GET single post by ID (Includes author, likes, and full comments with author)
router.get('/:id', async (req, res) => {
    try {
        const post = await Post.findByPk(req.params.id, {
            include: [
                {
                    model: User,
                    as: 'author',
                    attributes: ['id', 'name', 'email', 'avatarUrl']
                },
                {
                    model: Like,
                    as: 'likes',
                    attributes: ['id', 'userId']
                },
                {
                    model: Comment,
                    as: 'comments',
                    include: [{
                        model: User,
                        as: 'author',
                        attributes: ['id', 'name', 'email', 'avatarUrl']
                    }]
                }
            ]
        });

        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }

        const json = post.toJSON();
        json.likeCount = json.likes ? json.likes.length : 0;
        json.commentCount = json.comments ? json.comments.length : 0;

        res.status(200).json({ post: json });
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch post', error: error.message });
    }
});

// DELETE a post (Protected - author only)
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const post = await Post.findByPk(req.params.id);

        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }

        if (post.userId !== req.user.id) {
            return res.status(403).json({ message: 'Unauthorized to delete this post' });
        }

        await post.destroy();

        res.status(200).json({ message: 'Post deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to delete post', error: error.message });
    }
});

// =================================================================
// LIKES ENDPOINTS
// =================================================================

// TOGGLE LIKE on a post (Protected)
router.post('/:id/like', authenticateToken, async (req, res) => {
    try {
        const postId = req.params.id;
        const userId = req.user.id;

        const post = await Post.findByPk(postId);
        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }

        const existingLike = await Like.findOne({ where: { userId, postId } });

        if (existingLike) {
            // Unlike: Remove existing like
            await existingLike.destroy();
            const likeCount = await Like.count({ where: { postId } });
            return res.status(200).json({ message: 'Post unliked successfully', liked: false, likeCount });
        } else {
            // Like: Create new like
            await Like.create({ userId, postId });
            const likeCount = await Like.count({ where: { postId } });
            return res.status(201).json({ message: 'Post liked successfully', liked: true, likeCount });
        }
    } catch (error) {
        res.status(500).json({ message: 'Failed to toggle like', error: error.message });
    }
});

// =================================================================
// BOOKMARKS ENDPOINTS
// =================================================================

// TOGGLE BOOKMARK / SAVE POST (Protected)
router.post('/:id/bookmark', authenticateToken, async (req, res) => {
    try {
        const postId = req.params.id;
        const userId = req.user.id;

        const post = await Post.findByPk(postId);
        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }

        const existingBookmark = await Bookmark.findOne({ where: { userId, postId } });

        if (existingBookmark) {
            // Remove bookmark
            await existingBookmark.destroy();
            return res.status(200).json({ message: 'Post removed from saved bookmarks', bookmarked: false });
        } else {
            // Add bookmark
            await Bookmark.create({ userId, postId });
            return res.status(201).json({ message: 'Post saved to bookmarks successfully', bookmarked: true });
        }
    } catch (error) {
        res.status(500).json({ message: 'Failed to toggle bookmark', error: error.message });
    }
});

// =================================================================
// COMMENTS ENDPOINTS
// =================================================================

// ADD COMMENT to a post (Protected)
router.post('/:id/comments', authenticateToken, async (req, res) => {
    try {
        const postId = req.params.id;
        const { text } = req.body;

        if (!text || text.trim() === '') {
            return res.status(400).json({ message: 'Comment text is required' });
        }

        const post = await Post.findByPk(postId);
        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }

        const newComment = await Comment.create({
            text,
            postId,
            userId: req.user.id
        });

        // Fetch comment with author details (including avatarUrl)
        const commentWithAuthor = await Comment.findByPk(newComment.id, {
            include: [{
                model: User,
                as: 'author',
                attributes: ['id', 'name', 'email', 'avatarUrl']
            }]
        });

        res.status(201).json({
            message: 'Comment added successfully',
            comment: commentWithAuthor
        });
    } catch (error) {
        res.status(500).json({ message: 'Failed to add comment', error: error.message });
    }
});

// GET all comments for a post
router.get('/:id/comments', async (req, res) => {
    try {
        const postId = req.params.id;

        const comments = await Comment.findAll({
            where: { postId },
            order: [['createdAt', 'ASC']],
            include: [{
                model: User,
                as: 'author',
                attributes: ['id', 'name', 'email', 'avatarUrl']
            }]
        });

        res.status(200).json({
            count: comments.length,
            comments
        });
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch comments', error: error.message });
    }
});

// DELETE a comment (Protected - author only)
router.delete('/comments/:commentId', authenticateToken, async (req, res) => {
    try {
        const comment = await Comment.findByPk(req.params.commentId);

        if (!comment) {
            return res.status(404).json({ message: 'Comment not found' });
        }

        if (comment.userId !== req.user.id) {
            return res.status(403).json({ message: 'Unauthorized to delete this comment' });
        }

        await comment.destroy();

        res.status(200).json({ message: 'Comment deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to delete comment', error: error.message });
    }
});

module.exports = router;
