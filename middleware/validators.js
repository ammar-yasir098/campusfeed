const { body } = require('express-validator');

/**
 * Validation rules for /api/auth/signup
 */
const signupValidation = [
    body('name')
        .trim()
        .notEmpty().withMessage('Name is required')
        .isLength({ min: 2, max: 50 }).withMessage('Name must be between 2 and 50 characters'),

    body('email')
        .trim()
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Please provide a valid email address')
        .normalizeEmail(),

    body('password')
        .notEmpty().withMessage('Password is required')
        .isLength({ min: 6 }).withMessage('Password must be at least 6 characters long')
];

/**
 * Validation rules for /api/auth/login
 */
const loginValidation = [
    body('email')
        .trim()
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Please provide a valid email address')
        .normalizeEmail(),

    body('password')
        .notEmpty().withMessage('Password is required')
];

/**
 * Validation rules for POST /api/posts (create post)
 */
const postValidation = [
    body('title')
        .trim()
        .notEmpty().withMessage('Post title is required')
        .isLength({ max: 200 }).withMessage('Title cannot exceed 200 characters'),

    body('content')
        .optional()
        .trim()
        .isLength({ max: 5000 }).withMessage('Content cannot exceed 5000 characters'),

    body('category')
        .optional()
        .trim()
        .isLength({ max: 50 }).withMessage('Category cannot exceed 50 characters')
];

/**
 * Validation rules for POST /api/posts/:id/comments
 */
const commentValidation = [
    body('text')
        .trim()
        .notEmpty().withMessage('Comment text is required')
        .isLength({ min: 1, max: 1000 }).withMessage('Comment must be between 1 and 1000 characters')
];

/**
 * Validation rules for PUT /api/users/profile
 */
const profileValidation = [
    body('name')
        .optional()
        .trim()
        .isLength({ min: 2, max: 50 }).withMessage('Name must be between 2 and 50 characters'),

    body('bio')
        .optional()
        .trim()
        .isLength({ max: 500 }).withMessage('Bio cannot exceed 500 characters'),

    body('studentId')
        .optional()
        .trim()
        .isLength({ max: 30 }).withMessage('Student ID cannot exceed 30 characters'),

    body('department')
        .optional()
        .trim()
        .isLength({ max: 100 }).withMessage('Department cannot exceed 100 characters')
];

module.exports = {
    signupValidation,
    loginValidation,
    postValidation,
    commentValidation,
    profileValidation
};
