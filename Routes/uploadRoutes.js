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

module.exports = router;
