/**
 * User Controller
 * Handles user profile operations
 */

const User = require('../models/User');
const Certificate = require('../models/Certificate');

/**
 * @route   GET /api/users/:id
 * @desc    Get user profile by ID
 * @access  Private
 */
const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .populate('joinedCommunities', 'name avatar members')
      .select('-password');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Get user certificates
    const certificates = await Certificate.find({ user: user._id })
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      user,
      certificates
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * @route   PUT /api/users/profile
 * @desc    Update own profile
 * @access  Private
 */
const updateProfile = async (req, res) => {
  try {
    const { name, bloodGroup, phone, location, bio, avatar } = req.body;

    const updateFields = {};
    if (name) updateFields.name = name;
    if (bloodGroup) updateFields.bloodGroup = bloodGroup;
    if (phone !== undefined) updateFields.phone = phone;
    if (location !== undefined) updateFields.location = location;
    if (bio !== undefined) updateFields.bio = bio;
    if (avatar !== undefined) updateFields.avatar = avatar;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updateFields,
      { new: true, runValidators: true }
    ).select('-password');

    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error updating profile' });
  }
};

/**
 * @route   GET /api/users/search?q=
 * @desc    Search users by name or email
 * @access  Private
 */
const searchUsers = async (req, res) => {
  try {
    const query = req.query.q;
    if (!query) {
      return res.status(400).json({ success: false, message: 'Search query required' });
    }

    const users = await User.find({
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { email: { $regex: query, $options: 'i' } }
      ]
    })
      .select('name email bloodGroup location avatar isVerifiedDonor donationCount')
      .limit(20);

    res.json({ success: true, users });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error searching users' });
  }
};

module.exports = { getUserProfile, updateProfile, searchUsers };
