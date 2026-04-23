/**
 * Dashboard Routes
 * /api/dashboard
 */

const express = require('express');
const router = express.Router();
const { getStats, getNotifications, markNotificationsRead } = require('../controllers/dashboardController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

// Get platform stats - GET /api/dashboard/stats
router.get('/stats', getStats);

// Get user notifications - GET /api/dashboard/notifications
router.get('/notifications', getNotifications);

// Mark all notifications as read - PUT /api/dashboard/notifications/read
router.put('/notifications/read', markNotificationsRead);

module.exports = router;
