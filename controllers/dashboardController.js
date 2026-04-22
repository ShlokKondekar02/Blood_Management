/**
 * Dashboard Controller
 * Provides analytics and statistics
 */

const User = require('../models/User');
const Community = require('../models/Community');
const BloodRequest = require('../models/BloodRequest');
const Message = require('../models/Message');
const Certificate = require('../models/Certificate');
const Notification = require('../models/Notification');

/**
 * @route   GET /api/dashboard/stats
 * @desc    Get platform-wide analytics
 * @access  Private
 */
const getStats = async (req, res) => {
  try {
    // Aggregate all stats in parallel for performance
    const [
      totalUsers,
      totalCommunities,
      totalRequests,
      openRequests,
      acceptedRequests,
      completedRequests,
      totalMessages,
      totalCertificates,
      verifiedDonors,
      bloodGroupStats,
      recentRequests,
      topCommunities
    ] = await Promise.all([
      User.countDocuments(),
      Community.countDocuments(),
      BloodRequest.countDocuments(),
      BloodRequest.countDocuments({ status: 'open' }),
      BloodRequest.countDocuments({ status: 'accepted' }),
      BloodRequest.countDocuments({ status: 'completed' }),
      Message.countDocuments({ isDeleted: false }),
      Certificate.countDocuments(),
      User.countDocuments({ isVerifiedDonor: true }),
      // Blood group distribution
      BloodRequest.aggregate([
        { $group: { _id: '$bloodGroup', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),
      // Recent requests
      BloodRequest.find()
        .populate('requester', 'name avatar')
        .sort({ createdAt: -1 })
        .limit(5),
      // Top communities by member count
      Community.aggregate([
        { $project: { name: 1, memberCount: { $size: '$members' } } },
        { $sort: { memberCount: -1 } },
        { $limit: 5 }
      ])
    ]);

    res.json({
      success: true,
      stats: {
        totalUsers,
        totalCommunities,
        totalRequests,
        openRequests,
        acceptedRequests,
        completedRequests,
        totalMessages,
        totalCertificates,
        verifiedDonors,
        bloodGroupStats,
        recentRequests,
        topCommunities
      }
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching stats' });
  }
};

/**
 * @route   GET /api/dashboard/notifications
 * @desc    Get user notifications
 * @access  Private
 */
const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(20);

    const unreadCount = await Notification.countDocuments({
      user: req.user._id,
      isRead: false
    });

    res.json({ success: true, notifications, unreadCount });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * @route   PUT /api/dashboard/notifications/read
 * @desc    Mark all notifications as read
 * @access  Private
 */
const markNotificationsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { user: req.user._id, isRead: false },
      { isRead: true }
    );

    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = { getStats, getNotifications, markNotificationsRead };
