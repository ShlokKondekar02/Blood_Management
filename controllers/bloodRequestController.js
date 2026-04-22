/**
 * Blood Request Controller
 * Handles blood donation request CRUD operations
 */

const BloodRequest = require('../models/BloodRequest');
const Message = require('../models/Message');
const Notification = require('../models/Notification');
const Community = require('../models/Community');

/**
 * @route   POST /api/blood-requests
 * @desc    Create a new blood request
 * @access  Private
 */
const createBloodRequest = async (req, res) => {
  try {
    const {
      communityId, bloodGroup, urgency, location,
      hospitalName, contactNumber, unitsNeeded,
      description, requestType
    } = req.body;

    // Validate required fields
    if (!bloodGroup || !location || !contactNumber) {
      return res.status(400).json({
        success: false,
        message: 'Blood group, location, and contact number are required'
      });
    }

    // Create blood request
    const bloodRequest = await BloodRequest.create({
      requester: req.user._id,
      community: communityId || null,
      bloodGroup,
      urgency: urgency || 'urgent',
      location,
      hospitalName: hospitalName || '',
      contactNumber,
      unitsNeeded: unitsNeeded || 1,
      description: description || '',
      requestType: requestType || 'self'
    });

    // If community is specified, create an emergency message in the group
    if (communityId) {
      const urgencyLabel = urgency === 'critical' ? '🚨 CRITICAL' : urgency === 'urgent' ? '⚠️ URGENT' : '📋 NORMAL';
      const messageContent = `${urgencyLabel} BLOOD REQUEST\n\nBlood Group: ${bloodGroup}\nLocation: ${location}\nHospital: ${hospitalName || 'N/A'}\nUnits: ${unitsNeeded || 1}\nContact: ${contactNumber}\n\n${description || 'Please help if you can!'}`;

      await Message.create({
        community: communityId,
        sender: req.user._id,
        content: messageContent,
        type: urgency === 'critical' ? 'emergency' : 'blood_request',
        bloodRequest: bloodRequest._id
      });

      // Notify all community members
      const community = await Community.findById(communityId);
      if (community) {
        const notifications = community.members
          .filter(m => m.toString() !== req.user._id.toString())
          .map(memberId => ({
            user: memberId,
            type: 'blood_request',
            title: `${urgencyLabel} Blood Request`,
            message: `${req.user.name} needs ${bloodGroup} blood at ${location}`,
            link: `/community/${communityId}`
          }));

        if (notifications.length > 0) {
          await Notification.insertMany(notifications);
        }
      }
    }

    const populated = await BloodRequest.findById(bloodRequest._id)
      .populate('requester', 'name avatar bloodGroup phone');

    res.status(201).json({ success: true, bloodRequest: populated });
  } catch (error) {
    console.error('Create blood request error:', error);
    res.status(500).json({ success: false, message: 'Server error creating blood request' });
  }
};

/**
 * @route   GET /api/blood-requests
 * @desc    Get all open blood requests
 * @access  Private
 */
const getAllBloodRequests = async (req, res) => {
  try {
    const { status, bloodGroup } = req.query;
    const filter = {};

    if (status) filter.status = status;
    else filter.status = { $in: ['open', 'accepted'] };

    if (bloodGroup) filter.bloodGroup = bloodGroup;

    const requests = await BloodRequest.find(filter)
      .populate('requester', 'name avatar bloodGroup phone location')
      .populate('community', 'name')
      .populate('acceptedBy', 'name avatar')
      .sort({ createdAt: -1 });

    res.json({ success: true, requests });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * @route   GET /api/blood-requests/:id
 * @desc    Get single blood request
 * @access  Private
 */
const getBloodRequest = async (req, res) => {
  try {
    const request = await BloodRequest.findById(req.params.id)
      .populate('requester', 'name avatar bloodGroup phone location')
      .populate('community', 'name')
      .populate('acceptedBy', 'name avatar phone bloodGroup');

    if (!request) {
      return res.status(404).json({ success: false, message: 'Blood request not found' });
    }

    res.json({ success: true, request });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * @route   PUT /api/blood-requests/:id/status
 * @desc    Update blood request status
 * @access  Private
 */
const updateStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const request = await BloodRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({ success: false, message: 'Blood request not found' });
    }

    // Only requester can update status
    if (request.requester.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Only requester can update status' });
    }

    request.status = status;
    await request.save();

    const populated = await BloodRequest.findById(request._id)
      .populate('requester', 'name avatar')
      .populate('acceptedBy', 'name avatar');

    res.json({ success: true, request: populated });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * @route   GET /api/blood-requests/community/:communityId
 * @desc    Get blood requests for a specific community
 * @access  Private
 */
const getCommunityRequests = async (req, res) => {
  try {
    const requests = await BloodRequest.find({
      community: req.params.communityId
    })
      .populate('requester', 'name avatar bloodGroup')
      .populate('acceptedBy', 'name avatar')
      .sort({ createdAt: -1 });

    res.json({ success: true, requests });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = {
  createBloodRequest,
  getAllBloodRequests,
  getBloodRequest,
  updateStatus,
  getCommunityRequests
};
