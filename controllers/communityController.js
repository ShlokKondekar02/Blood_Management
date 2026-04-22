/**
 * Community Controller
 * Handles community/group CRUD and membership operations
 */

const Community = require('../models/Community');
const User = require('../models/User');
const Message = require('../models/Message');

/**
 * @route   POST /api/communities
 * @desc    Create a new community
 * @access  Private
 */
const createCommunity = async (req, res) => {
  try {
    const { name, description, tags } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: 'Community name is required' });
    }

    // Create community with current user as leader and first member
    const community = await Community.create({
      name,
      description: description || '',
      tags: tags || [],
      leader: req.user._id,
      members: [req.user._id]
    });

    // Add community to user's joined list
    await User.findByIdAndUpdate(req.user._id, {
      $addToSet: { joinedCommunities: community._id }
    });

    // Create system message
    await Message.create({
      community: community._id,
      sender: req.user._id,
      content: `${req.user.name} created the group "${name}"`,
      type: 'system'
    });

    const populated = await Community.findById(community._id)
      .populate('leader', 'name email avatar')
      .populate('members', 'name email avatar bloodGroup');

    res.status(201).json({ success: true, community: populated });
  } catch (error) {
    console.error('Create community error:', error);
    res.status(500).json({ success: false, message: 'Server error creating community' });
  }
};

/**
 * @route   GET /api/communities
 * @desc    Get all public communities
 * @access  Private
 */
const getAllCommunities = async (req, res) => {
  try {
    const communities = await Community.find({ isPublic: true })
      .populate('leader', 'name avatar')
      .populate('members', 'name avatar')
      .sort({ createdAt: -1 });

    res.json({ success: true, communities });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * @route   GET /api/communities/my
 * @desc    Get communities the user has joined
 * @access  Private
 */
const getMyCommunities = async (req, res) => {
  try {
    const communities = await Community.find({
      members: req.user._id
    })
      .populate('leader', 'name avatar')
      .populate('members', 'name avatar bloodGroup')
      .sort({ updatedAt: -1 });

    res.json({ success: true, communities });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * @route   GET /api/communities/:id
 * @desc    Get single community by ID
 * @access  Private
 */
const getCommunity = async (req, res) => {
  try {
    const community = await Community.findById(req.params.id)
      .populate('leader', 'name email avatar bloodGroup')
      .populate('members', 'name email avatar bloodGroup isOnline isVerifiedDonor')
      .populate({
        path: 'pinnedMessages',
        populate: { path: 'sender', select: 'name avatar' }
      });

    if (!community) {
      return res.status(404).json({ success: false, message: 'Community not found' });
    }

    res.json({ success: true, community });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * @route   POST /api/communities/:id/join
 * @desc    Join a community
 * @access  Private
 */
const joinCommunity = async (req, res) => {
  try {
    const community = await Community.findById(req.params.id);

    if (!community) {
      return res.status(404).json({ success: false, message: 'Community not found' });
    }

    // Check if already a member
    if (community.members.includes(req.user._id)) {
      return res.status(400).json({ success: false, message: 'Already a member of this community' });
    }

    // Add user to community members
    community.members.push(req.user._id);
    await community.save();

    // Add community to user's joined list
    await User.findByIdAndUpdate(req.user._id, {
      $addToSet: { joinedCommunities: community._id }
    });

    // System message
    await Message.create({
      community: community._id,
      sender: req.user._id,
      content: `${req.user.name} joined the group`,
      type: 'system'
    });

    const populated = await Community.findById(community._id)
      .populate('leader', 'name avatar')
      .populate('members', 'name avatar bloodGroup');

    res.json({ success: true, community: populated });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error joining community' });
  }
};

/**
 * @route   POST /api/communities/:id/leave
 * @desc    Leave a community
 * @access  Private
 */
const leaveCommunity = async (req, res) => {
  try {
    const community = await Community.findById(req.params.id);

    if (!community) {
      return res.status(404).json({ success: false, message: 'Community not found' });
    }

    // Leader cannot leave — they must transfer leadership first
    if (community.leader.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Group leader cannot leave. Transfer leadership first.'
      });
    }

    // Remove user from members
    community.members = community.members.filter(
      m => m.toString() !== req.user._id.toString()
    );
    await community.save();

    // Remove community from user's list
    await User.findByIdAndUpdate(req.user._id, {
      $pull: { joinedCommunities: community._id }
    });

    // System message
    await Message.create({
      community: community._id,
      sender: req.user._id,
      content: `${req.user.name} left the group`,
      type: 'system'
    });

    res.json({ success: true, message: 'Left community successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error leaving community' });
  }
};

/**
 * @route   DELETE /api/communities/:id/members/:userId
 * @desc    Remove a member (leader only)
 * @access  Private (Leader)
 */
const removeMember = async (req, res) => {
  try {
    const community = await Community.findById(req.params.id);

    if (!community) {
      return res.status(404).json({ success: false, message: 'Community not found' });
    }

    // Only leader can remove members
    if (community.leader.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Only the group leader can remove members' });
    }

    // Cannot remove self
    if (req.params.userId === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'Cannot remove yourself' });
    }

    // Remove member
    community.members = community.members.filter(
      m => m.toString() !== req.params.userId
    );
    await community.save();

    // Remove from user's joined list
    await User.findByIdAndUpdate(req.params.userId, {
      $pull: { joinedCommunities: community._id }
    });

    res.json({ success: true, message: 'Member removed successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error removing member' });
  }
};

/**
 * @route   GET /api/communities/search?q=
 * @desc    Search communities by name or description
 * @access  Private
 */
const searchCommunities = async (req, res) => {
  try {
    const query = req.query.q;
    if (!query) {
      return res.status(400).json({ success: false, message: 'Search query required' });
    }

    const communities = await Community.find({
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } }
      ],
      isPublic: true
    })
      .populate('leader', 'name avatar')
      .populate('members', 'name avatar')
      .limit(20);

    res.json({ success: true, communities });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error searching communities' });
  }
};

module.exports = {
  createCommunity,
  getAllCommunities,
  getMyCommunities,
  getCommunity,
  joinCommunity,
  leaveCommunity,
  removeMember,
  searchCommunities
};
