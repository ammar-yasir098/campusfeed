const express = require('express');
const { User, Post, Like, Comment, Bookmark } = require('../models');
const authenticateToken = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');
const validate = require('../middleware/validate');
const { profileValidation } = require('../middleware/validators');

const router = express.Router();

// GET current authenticated user profile + activity (Protected)
router.get('/profile', authenticateToken, async (req, res) => {
    try {
        const user = await User.findByPk(req.user.id, {
            attributes: { exclude: ['password'] },
            include: [
                {
                    model: Post,
                    as: 'posts',
                    order: [['createdAt', 'DESC']],
                    include: [
                        { model: Like, as: 'likes', attributes: ['id'] },
                        { model: Comment, as: 'comments', attributes: ['id'] }
                    ]
                }
            ]
        });

        if (!user) {
            return res.status(404).json({ message: 'User profile not found' });
        }

        const userJson = user.toJSON();
        userJson.postCount = userJson.posts ? userJson.posts.length : 0;
        
        // Format post like and comment counts
        if (userJson.posts) {
            userJson.posts = userJson.posts.map(post => {
                post.likeCount = post.likes ? post.likes.length : 0;
                post.commentCount = post.comments ? post.comments.length : 0;
                return post;
            });
        }

        res.status(200).json({ user: userJson });
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch profile', error: error.message });
    }
});

// GET current user's saved/bookmarked posts (Protected)
router.get('/bookmarks', authenticateToken, async (req, res) => {
    try {
        const bookmarks = await Bookmark.findAll({
            where: { userId: req.user.id },
            order: [['createdAt', 'DESC']],
            include: [
                {
                    model: Post,
                    as: 'post',
                    include: [
                        {
                            model: User,
                            as: 'author',
                            attributes: ['id', 'name', 'email']
                        },
                        {
                            model: Like,
                            as: 'likes',
                            attributes: ['id']
                        },
                        {
                            model: Comment,
                            as: 'comments',
                            attributes: ['id']
                        }
                    ]
                }
            ]
        });

        const savedPosts = bookmarks
            .filter(b => b.post !== null)
            .map(b => {
                const postJson = b.post.toJSON();
                postJson.likeCount = postJson.likes ? postJson.likes.length : 0;
                postJson.commentCount = postJson.comments ? postJson.comments.length : 0;
                postJson.bookmarkedAt = b.createdAt;
                postJson.isBookmarked = true;
                return postJson;
            });

        res.status(200).json({
            count: savedPosts.length,
            savedPosts
        });
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch saved posts', error: error.message });
    }
});

// UPDATE current user profile (Protected - Stores path "uploads/filename")
router.put('/profile', authenticateToken, profileValidation, validate, (req, res) => {
    upload.single('avatar')(req, res, async (err) => {
        if (err) {
            return res.status(400).json({ message: err.message });
        }
        try {
            const { name, studentId, department, bio } = req.body;
            let avatarUrl = req.body ? req.body.avatarUrl : undefined;

            // If an avatar image file was uploaded in this request, build its relative path
            if (req.file) {
                avatarUrl = `uploads/${req.file.filename}`;
            }

            const user = await User.findByPk(req.user.id);
            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }

            if (name !== undefined) user.name = name;
            if (studentId !== undefined) user.studentId = studentId;
            if (department !== undefined) user.department = department;
            if (bio !== undefined) user.bio = bio;
            if (avatarUrl !== undefined) user.avatarUrl = avatarUrl;

            await user.save();

            const updatedUser = user.toJSON();
            delete updatedUser.password;

            res.status(200).json({
                message: 'Profile updated successfully',
                user: updatedUser
            });
        } catch (error) {
            res.status(500).json({ message: 'Failed to update profile', error: error.message });
        }
    });
});

// GET public profile of any user by ID
router.get('/:id', async (req, res) => {
    try {
        const user = await User.findByPk(req.params.id, {
            attributes: { exclude: ['password'] },
            include: [
                {
                    model: Post,
                    as: 'posts',
                    order: [['createdAt', 'DESC']]
                }
            ]
        });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const userJson = user.toJSON();
        userJson.postCount = userJson.posts ? userJson.posts.length : 0;

        res.status(200).json({ user: userJson });
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch user profile', error: error.message });
    }
});

module.exports = router;
