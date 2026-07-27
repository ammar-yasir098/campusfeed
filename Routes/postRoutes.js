const express = require('express');
const { Post, User, Like, Comment } = require('../models');
const authenticateToken = require('../middleware/authMiddleware');

const router = express.Router();

// CREATE a new post (Protected)
router.post('/', authenticateToken, async (req, res) => {
    try {
        const { title, content, category, imageUrl } = req.body;

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
                attributes: ['id', 'name', 'email']
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

// GET all posts (Public feed with author info, like count, comment count, and category filter)
router.get('/', async (req, res) => {
    try {
        const { category } = req.query;
        const whereClause = {};

        if (category) {
            whereClause.category = category;
        }

        const posts = await Post.findAll({
            where: whereClause,
            order: [['createdAt', 'DESC']],
            include: [
                {
                    model: User,
                    as: 'author',
                    attributes: ['id', 'name', 'email']
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
            return json;
        });

        res.status(200).json({
            count: formattedPosts.length,
            posts: formattedPosts
        });
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch posts', error: error.message });
    }
});

// GET single post by ID (Includes author, likes, and comments)
router.get('/:id', async (req, res) => {
    try {
        const post = await Post.findByPk(req.params.id, {
            include: [
                {
                    model: User,
                    as: 'author',
                    attributes: ['id', 'name', 'email']
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
                        attributes: ['id', 'name', 'email']
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

        // Fetch comment with author details
        const commentWithAuthor = await Comment.findByPk(newComment.id, {
            include: [{
                model: User,
                as: 'author',
                attributes: ['id', 'name', 'email']
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
                attributes: ['id', 'name', 'email']
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
