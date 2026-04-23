/**
 * Reply Routes
 * /api/replies
 */

const express = require('express');
const router = express.Router();
const { createReply, getReplies } = require('../controllers/replyController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

// Create reply - POST /api/replies
router.post('/', createReply);

// Get replies for a blood request - GET /api/replies/:requestId
router.get('/:requestId', getReplies);

module.exports = router;
