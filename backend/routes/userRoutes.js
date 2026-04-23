/**
 * User Routes
 * /api/users
 */

const express = require('express');
const router = express.Router();
const { getUserProfile, updateProfile, searchUsers } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

// All user routes require authentication
router.use(protect);

// Search users - GET /api/users/search?q=
router.get('/search', searchUsers);

// Update profile - PUT /api/users/profile
router.put('/profile', updateProfile);

// Get user profile - GET /api/users/:id
router.get('/:id', getUserProfile);

module.exports = router;
