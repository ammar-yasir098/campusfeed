const express = require('express');
const { Post, User } = require('../models');
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

// GET all posts (Public feed with author info and optional category filtering)
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
            include: [{
                model: User,
                as: 'author',
                attributes: ['id', 'name', 'email']
            }]
        });

        res.status(200).json({
            count: posts.length,
            posts
        });
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch posts', error: error.message });
    }
});

// GET single post by ID
router.get('/:id', async (req, res) => {
    try {
        const post = await Post.findByPk(req.params.id, {
            include: [{
                model: User,
                as: 'author',
                attributes: ['id', 'name', 'email']
            }]
        });

        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }

        res.status(200).json({ post });
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

        // Verify that current user owns the post
        if (post.userId !== req.user.id) {
            return res.status(403).json({ message: 'Unauthorized to delete this post' });
        }

        await post.destroy();

        res.status(200).json({ message: 'Post deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to delete post', error: error.message });
    }
});

module.exports = router;
