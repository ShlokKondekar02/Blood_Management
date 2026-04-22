/**
 * Message Controller
 * Handles chat messages within communities
 */

const Message = require('../models/Message');
const Community = require('../models/Community');

/**
 * @route   GET /api/messages/:communityId
 * @desc    Get messages for a community (paginated)
 * @access  Private
 */
const getMessages = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    const messages = await Message.find({
      community: req.params.communityId,
      isDeleted: false
    })
      .populate('sender', 'name avatar bloodGroup isVerifiedDonor')
      .populate({
        path: 'bloodRequest',
        populate: { path: 'requester', select: 'name avatar' }
      })
      .sort({ createdAt: 1 })
      .skip(skip)
      .limit(limit);

    const total = await Message.countDocuments({
      community: req.params.communityId,
      isDeleted: false
    });

    res.json({
      success: true,
      messages,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error fetching messages' });
  }
};

/**
 * @route   POST /api/messages
 * @desc    Send a message to a community
 * @access  Private
 */
const sendMessage = async (req, res) => {
  try {
    const { communityId, content, type, bloodRequest } = req.body;

    if (!communityId || !content) {
      return res.status(400).json({
        success: false,
        message: 'Community ID and content are required'
      });
    }

    // Verify user is a member of the community
    const community = await Community.findById(communityId);
    if (!community) {
      return res.status(404).json({ success: false, message: 'Community not found' });
    }

    if (!community.members.includes(req.user._id)) {
      return res.status(403).json({ success: false, message: 'You are not a member of this community' });
    }

    // Create message
    const message = await Message.create({
      community: communityId,
      sender: req.user._id,
      content,
      type: type || 'text',
      bloodRequest: bloodRequest || null
    });

    // Update community message count
    community.messageCount += 1;
    await community.save();

    // Populate sender info before returning
    const populated = await Message.findById(message._id)
      .populate('sender', 'name avatar bloodGroup isVerifiedDonor')
      .populate({
        path: 'bloodRequest',
        populate: { path: 'requester', select: 'name avatar' }
      });

    res.status(201).json({ success: true, message: populated });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ success: false, message: 'Server error sending message' });
  }
};

/**
 * @route   PUT /api/messages/:id/pin
 * @desc    Pin/unpin a message (leader only)
 * @access  Private (Leader)
 */
const pinMessage = async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);
    if (!message) {
      return res.status(404).json({ success: false, message: 'Message not found' });
    }

    // Check if user is community leader
    const community = await Community.findById(message.community);
    if (community.leader.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Only the group leader can pin messages' });
    }

    // Toggle pin status
    message.isPinned = !message.isPinned;
    await message.save();

    // Update community pinned messages list
    if (message.isPinned) {
      community.pinnedMessages.push(message._id);
    } else {
      community.pinnedMessages = community.pinnedMessages.filter(
        id => id.toString() !== message._id.toString()
      );
    }
    await community.save();

    res.json({ success: true, message });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error pinning message' });
  }
};

/**
 * @route   DELETE /api/messages/:id
 * @desc    Delete a message (leader or sender)
 * @access  Private
 */
const deleteMessage = async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);
    if (!message) {
      return res.status(404).json({ success: false, message: 'Message not found' });
    }

    // Check if user is sender or community leader
    const community = await Community.findById(message.community);
    const isLeader = community.leader.toString() === req.user._id.toString();
    const isSender = message.sender.toString() === req.user._id.toString();

    if (!isLeader && !isSender) {
      return res.status(403).json({
        success: false,
        message: 'Only message sender or group leader can delete messages'
      });
    }

    // Soft delete
    message.isDeleted = true;
    message.content = 'This message has been deleted';
    await message.save();

    res.json({ success: true, message: 'Message deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error deleting message' });
  }
};

module.exports = { getMessages, sendMessage, pinMessage, deleteMessage };
