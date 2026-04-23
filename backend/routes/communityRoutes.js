/**
 * Community Routes
 * /api/communities
 */

const express = require('express');
const router = express.Router();
const {
  createCommunity,
  getAllCommunities,
  getMyCommunities,
  getCommunity,
  joinCommunity,
  leaveCommunity,
  removeMember,
  searchCommunities
} = require('../controllers/communityController');
const { protect } = require('../middleware/authMiddleware');

// All community routes require authentication
router.use(protect);

// Search communities - GET /api/communities/search?q=
router.get('/search', searchCommunities);

// Get my communities - GET /api/communities/my
router.get('/my', getMyCommunities);

// Create community - POST /api/communities
router.post('/', createCommunity);

// Get all communities - GET /api/communities
router.get('/', getAllCommunities);

// Get single community - GET /api/communities/:id
router.get('/:id', getCommunity);

// Join community - POST /api/communities/:id/join
router.post('/:id/join', joinCommunity);

// Leave community - POST /api/communities/:id/leave
router.post('/:id/leave', leaveCommunity);

// Remove member (leader only) - DELETE /api/communities/:id/members/:userId
router.delete('/:id/members/:userId', removeMember);

module.exports = router;
