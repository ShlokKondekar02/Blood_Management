/**
 * Auth Routes
 * /api/auth
 */

const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { register, login, logout, getMe } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

// Register - POST /api/auth/register
router.post('/register', [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
], register);

// Login - POST /api/auth/login
router.post('/login', login);

// Logout - POST /api/auth/logout
router.post('/logout', protect, logout);

// Get Current User - GET /api/auth/me
router.get('/me', protect, getMe);

module.exports = router;
