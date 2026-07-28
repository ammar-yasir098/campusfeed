const express = require('express');
const jwt = require('jsonwebtoken');
const { Post, User, Like, Comment, Bookmark, Poll, PollOption, PollVote } = require('../models');
const authenticateToken = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

const router = express.Router();

// Utility to extract userId optionally from authorization header (for GET calls)
const getUserIdFromHeader = (req) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        if (!token) return null;
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        return decoded ? decoded.userId : null;
    } catch (e) {
        return null;
    }
};

// Utility to format poll JSON data
const formatPoll = (pollJson, userId) => {
    if (!pollJson) return null;
    const totalVotes = pollJson.votes ? pollJson.votes.length : 0;
    const userVote = userId && pollJson.votes ? pollJson.votes.find(v => v.userId === userId) : null;

    const options = (pollJson.options || []).map(opt => {
        const voteCount = pollJson.votes ? pollJson.votes.filter(v => v.optionId === opt.id).length : 0;
        const percentage = totalVotes > 0 ? parseFloat(((voteCount / totalVotes) * 100).toFixed(1)) : 0;
        const votedByCurrentUser = userVote ? userVote.optionId === opt.id : false;
        return {
            id: opt.id,
            optionText: opt.optionText,
            voteCount,
            percentage,
            votedByCurrentUser
        };
    });

    return {
        id: pollJson.id,
        question: pollJson.question,
        totalVotes,
        userVotedOptionId: userVote ? userVote.optionId : null,
        options
    };
};

const pollInclude = {
    model: Poll,
    as: 'poll',
    include: [
        {
            model: PollOption,
            as: 'options'
        },
        {
            model: PollVote,
            as: 'votes',
            attributes: ['id', 'optionId', 'userId']
        }
    ]
};

// CREATE a new post (Protected - Stores path "uploads/filename" and handles optional poll)
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

            // Parse Poll Data if provided
            let pollData = req.body.poll;
            if (typeof pollData === 'string') {
                try { pollData = JSON.parse(pollData); } catch (e) {}
            }

            const hasValidPoll = pollData && Array.isArray(pollData.options) && pollData.options.filter(opt => typeof opt === 'string' && opt.trim() !== '').length >= 2;

            if (!title || (!content && !hasValidPoll)) {
                return res.status(400).json({ message: 'Title is required, and content or a poll must be provided' });
            }

            const newPost = await Post.create({
                title,
                content: content || null,
                category: category || 'General',
                imageUrl: imageUrl || null,
                userId: req.user.id
            });

            // Handle Poll Creation if provided
            if (hasValidPoll) {
                const validOptions = pollData.options.filter(opt => typeof opt === 'string' && opt.trim() !== '');
                const newPoll = await Poll.create({
                    postId: newPost.id,
                    question: pollData.question || null
                });
                const optionPromises = validOptions.map(optText => 
                    PollOption.create({ pollId: newPoll.id, optionText: optText.trim() })
                );
                await Promise.all(optionPromises);
            }

            // Fetch created post with author details & poll included
            const postWithAuthor = await Post.findByPk(newPost.id, {
                include: [
                    {
                        model: User,
                        as: 'author',
                        attributes: ['id', 'name', 'email', 'avatarUrl']
                    },
                    pollInclude
                ]
            });

            const json = postWithAuthor.toJSON();
            json.likeCount = 0;
            json.commentCount = 0;
            json.poll = formatPoll(json.poll, req.user.id);

            res.status(201).json({
                message: 'Post created successfully',
                post: json
            });
        } catch (error) {
            res.status(500).json({ message: 'Failed to create post', error: error.message });
        }
    });
});

// GET all posts (Public feed with author info, like count, comment count, category filter, limit & offset pagination, poll info)
router.get('/', async (req, res) => {
    try {
        const { category, limit: queryLimit, offset: queryOffset } = req.query;
        const currentUserId = getUserIdFromHeader(req);
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
                },
                pollInclude
            ]
        });

        const formattedPosts = posts.map(post => {
            const json = post.toJSON();
            json.likeCount = json.likes ? json.likes.length : 0;
            json.commentCount = json.comments ? json.comments.length : 0;
            json.poll = formatPoll(json.poll, currentUserId);
            delete json.comments;
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

// GET single post by ID (Includes author, likes, full comments with author, and poll info)
router.get('/:id', async (req, res) => {
    try {
        const currentUserId = getUserIdFromHeader(req);
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
                },
                pollInclude
            ]
        });

        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }

        const json = post.toJSON();
        json.likeCount = json.likes ? json.likes.length : 0;
        json.commentCount = json.comments ? json.comments.length : 0;
        json.poll = formatPoll(json.poll, currentUserId);

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
// POLL ENDPOINTS
// =================================================================

// VOTE ON A POLL (Protected - Locked voting, single vote per user)
router.post('/:id/poll/vote', authenticateToken, async (req, res) => {
    try {
        const postId = req.params.id;
        const { optionId } = req.body;
        const userId = req.user.id;

        if (!optionId) {
            return res.status(400).json({ message: 'Option ID is required to vote' });
        }

        const poll = await Poll.findOne({ where: { postId } });
        if (!poll) {
            return res.status(404).json({ message: 'Poll not found for this post' });
        }

        // Verify option belongs to this poll
        const option = await PollOption.findOne({ where: { id: optionId, pollId: poll.id } });
        if (!option) {
            return res.status(400).json({ message: 'Invalid option selected for this poll' });
        }

        // Check if user has already voted on this poll
        const existingVote = await PollVote.findOne({ where: { pollId: poll.id, userId } });
        if (existingVote) {
            return res.status(400).json({ message: 'You have already voted in this poll. Votes cannot be changed.' });
        }

        // Create vote
        await PollVote.create({
            pollId: poll.id,
            optionId,
            userId
        });

        // Fetch updated poll with full votes and options
        const updatedPoll = await Poll.findByPk(poll.id, {
            include: [
                { model: PollOption, as: 'options' },
                { model: PollVote, as: 'votes', attributes: ['id', 'optionId', 'userId'] }
            ]
        });

        const formattedPoll = formatPoll(updatedPoll.toJSON(), userId);

        res.status(200).json({
            message: 'Vote cast successfully!',
            poll: formattedPoll
        });
    } catch (error) {
        res.status(500).json({ message: 'Failed to record vote', error: error.message });
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
