const { validationResult } = require('express-validator');

/**
 * Generic validation error handler middleware.
 * Use after express-validator chains to return 422 with field errors if validation fails.
 */
const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).json({
            message: 'Validation failed. Please check your input.',
            errors: errors.array().map(e => ({ field: e.path, message: e.msg }))
        });
    }
    next();
};

module.exports = validate;
