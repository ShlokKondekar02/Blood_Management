/**
 * Reply Controller
 * Handles quick replies to blood requests
 */

const Reply = require('../models/Reply');
const BloodRequest = require('../models/BloodRequest');
const Notification = require('../models/Notification');

/**
 * @route   POST /api/replies
 * @desc    Reply to a blood request
 * @access  Private
 */
const createReply = async (req, res) => {
  try {
    const { bloodRequestId, type, message } = req.body;

    if (!bloodRequestId || !type) {
      return res.status(400).json({
        success: false,
        message: 'Blood request ID and reply type are required'
      });
    }

    // Check if blood request exists
    const bloodRequest = await BloodRequest.findById(bloodRequestId);
    if (!bloodRequest) {
      return res.status(404).json({ success: false, message: 'Blood request not found' });
    }

    // Create reply
    const reply = await Reply.create({
      bloodRequest: bloodRequestId,
      user: req.user._id,
      type,
      message: message || ''
    });

    // Add user to acceptedBy list if "can_donate"
    if (type === 'can_donate') {
      await BloodRequest.findByIdAndUpdate(bloodRequestId, {
        $addToSet: { acceptedBy: req.user._id },
        status: 'accepted'
      });
    }

    // Notify the requester
    const replyLabels = {
      can_donate: '🩸 can donate blood',
      contact_me: '📞 wants you to contact them',
      nearby: '📍 is available nearby',
      hospital: '🏥 knows a hospital',
      blood_bank: '🏦 knows a blood bank'
    };

    await Notification.create({
      user: bloodRequest.requester,
      type: 'reply',
      title: 'New Reply to Your Blood Request',
      message: `${req.user.name} ${replyLabels[type] || 'replied to your request'}`,
      link: `/blood-request/${bloodRequestId}`
    });

    const populated = await Reply.findById(reply._id)
      .populate('user', 'name avatar bloodGroup phone isVerifiedDonor');

    res.status(201).json({ success: true, reply: populated });
  } catch (error) {
    console.error('Create reply error:', error);
    res.status(500).json({ success: false, message: 'Server error creating reply' });
  }
};

/**
 * @route   GET /api/replies/:requestId
 * @desc    Get all replies for a blood request
 * @access  Private
 */
const getReplies = async (req, res) => {
  try {
    const replies = await Reply.find({ bloodRequest: req.params.requestId })
      .populate('user', 'name avatar bloodGroup phone isVerifiedDonor location')
      .sort({ createdAt: -1 });

    res.json({ success: true, replies });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = { createReply, getReplies };
