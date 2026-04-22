/**
 * Blood Request Routes
 * /api/blood-requests
 */

const express = require('express');
const router = express.Router();
const {
  createBloodRequest,
  getAllBloodRequests,
  getBloodRequest,
  updateStatus,
  getCommunityRequests
} = require('../controllers/bloodRequestController');
const { protect } = require('../middleware/authMiddleware');

// All blood request routes require authentication
router.use(protect);

// Create blood request - POST /api/blood-requests
router.post('/', createBloodRequest);

// Get all open requests - GET /api/blood-requests
router.get('/', getAllBloodRequests);

// Get community requests - GET /api/blood-requests/community/:communityId
router.get('/community/:communityId', getCommunityRequests);

// Get single request - GET /api/blood-requests/:id
router.get('/:id', getBloodRequest);

// Update status - PUT /api/blood-requests/:id/status
router.put('/:id/status', updateStatus);

module.exports = router;
