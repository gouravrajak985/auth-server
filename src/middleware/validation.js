import { body, validationResult } from 'express-validator';
import { ApiError } from '../utils/ApiError.js';

// Validation error handler
export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(error => error.msg);
    throw new ApiError(400, `Validation failed: ${errorMessages.join(', ')}`);
  }
  next();
};

// Registration validation
export const validateRegistration = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('username')
    .isLength({ min: 3, max: 20 })
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username must be 3-20 characters long and contain only letters, numbers, and underscores'),
  body('password')
    .isLength({ min: 8 })
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
  handleValidationErrors
];

// Login validation
export const validateLogin = [
  body('email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('username')
    .optional()
    .isLength({ min: 3, max: 20 })
    .withMessage('Username must be 3-20 characters long'),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  // Custom validation to ensure either email or username is provided
  body().custom((value, { req }) => {
    if (!req.body.email && !req.body.username) {
      throw new Error('Either email or username is required');
    }
    return true;
  }),
  handleValidationErrors
];

// OTP validation
export const validateOTP = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('inputOtp')
    .isLength({ min: 6, max: 6 })
    .isNumeric()
    .withMessage('OTP must be exactly 6 digits'),
  handleValidationErrors
];

// Email check validation
export const validateEmailCheck = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  handleValidationErrors
];