/**
 * Message Routes
 * /api/messages
 */

const express = require('express');
const router = express.Router();
const { getMessages, sendMessage, pinMessage, deleteMessage } = require('../controllers/messageController');
const { protect } = require('../middleware/authMiddleware');

// All message routes require authentication
router.use(protect);

// Send message - POST /api/messages
router.post('/', sendMessage);

// Get messages for community - GET /api/messages/:communityId
router.get('/:communityId', getMessages);

// Pin message (leader) - PUT /api/messages/:id/pin
router.put('/:id/pin', pinMessage);

// Delete message - DELETE /api/messages/:id
router.delete('/:id', deleteMessage);

module.exports = router;
