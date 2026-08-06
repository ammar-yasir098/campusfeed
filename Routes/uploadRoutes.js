const express = require('express');
const upload = require('../middleware/uploadMiddleware');
const authenticateToken = require('../middleware/authMiddleware');

const router = express.Router();

// UPLOAD IMAGE (Protected - Returns path "uploads/filename")
router.post('/', authenticateToken, (req, res) => {
    upload.single('image')(req, res, (err) => {
        if (err) {
            return res.status(400).json({ message: err.message });
        }
        if (!req.file) {
            return res.status(400).json({ message: 'Please select an image file to upload' });
        }

        // Store path e.g. "uploads/image-12345.jpg"
        const imageUrl = `uploads/${req.file.filename}`;

        res.status(200).json({
            message: 'Image uploaded successfully',
            filename: req.file.filename,
            imageUrl: imageUrl
        });
    });
});

// UPLOAD VIDEO (Protected - Returns path "uploads/filename")
router.post('/video', authenticateToken, (req, res) => {
    upload.single('video')(req, res, (err) => {
        if (err) {
            return res.status(400).json({ message: err.message });
        }
        if (!req.file) {
            return res.status(400).json({ message: 'Please select a video file to upload' });
        }

        const videoUrl = `uploads/${req.file.filename}`;

        res.status(200).json({
            message: 'Video uploaded successfully',
            filename: req.file.filename,
            videoUrl: videoUrl
        });
    });
});

// UPLOAD MULTIPLE IMAGES (Protected - Up to 5 files, Returns array of paths "uploads/filename")
router.post('/multiple', authenticateToken, (req, res) => {
    upload.array('images', 5)(req, res, (err) => {
        if (err) {
            return res.status(400).json({ message: err.message });
        }
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ message: 'Please select at least one image to upload' });
        }

        const imageUrls = req.files.map(file => `uploads/${file.filename}`);

        res.status(200).json({
            message: 'Images uploaded successfully',
            imageUrls: imageUrls
        });
    });
});

module.exports = router;
