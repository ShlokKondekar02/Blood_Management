/**
 * Dashboard Controller (Firebase Firestore Implementation)
 * Provides analytics and statistics
 */

const { db } = require('../config/firebase');

/**
 * @route   GET /api/dashboard/stats
 * @desc    Get platform-wide analytics
 * @access  Private
 */
const getStats = async (req, res) => {
  try {
    // Aggregate all stats in parallel
    const [
      usersSnap,
      communitiesSnap,
      requestsSnap,
      messagesSnap,
      certsSnap,
      verifiedDonorsSnap,
      recentRequestsSnap
    ] = await Promise.all([
      db.collection('users').get(),
      db.collection('communities').get(),
      db.collection('bloodRequests').get(),
      db.collection('messages').where('isDeleted', '==', false).get(),
      db.collection('certificates').get(),
      db.collection('users').where('isVerifiedDonor', '==', true).get(),
      db.collection('bloodRequests').orderBy('createdAt', 'desc').limit(5).get()
    ]);

    const totalUsers = usersSnap.size;
    const totalCommunities = communitiesSnap.size;
    const allRequests = requestsSnap.docs.map(doc => doc.data());
    const totalRequests = requestsSnap.size;
    const openRequests = allRequests.filter(r => r.status === 'open').length;
    const acceptedRequests = allRequests.filter(r => r.status === 'accepted').length;
    const completedRequests = allRequests.filter(r => r.status === 'completed').length;
    const totalMessages = messagesSnap.size;
    const totalCertificates = certsSnap.size;
    const verifiedDonors = verifiedDonorsSnap.size;

    // Blood group distribution (Aggregate in memory)
    const bloodGroupMap = {};
    allRequests.forEach(r => {
      bloodGroupMap[r.bloodGroup] = (bloodGroupMap[r.bloodGroup] || 0) + 1;
    });
    const bloodGroupStats = Object.keys(bloodGroupMap)
      .map(group => ({ _id: group, count: bloodGroupMap[group] }))
      .sort((a, b) => b.count - a.count);

    // Recent requests (Populate)
    const recentRequests = await Promise.all(recentRequestsSnap.docs.map(async (doc) => {
      const data = doc.data();
      const requesterDoc = await db.collection('users').doc(data.requester).get();
      return {
        _id: doc.id,
        ...data,
        requester: requesterDoc.exists ? { _id: requesterDoc.id, name: requesterDoc.data().name, avatar: requesterDoc.data().avatar } : null
      };
    }));

    // Top communities by member count
    const topCommunities = communitiesSnap.docs
      .map(doc => ({ 
        _id: doc.id, 
        name: doc.data().name, 
        memberCount: doc.data().members ? doc.data().members.length : 0 
      }))
      .sort((a, b) => b.memberCount - a.memberCount)
      .slice(0, 5);

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
    const snapshot = await db.collection('notifications')
      .where('user', '==', req.user._id)
      .get();

    const notifications = snapshot.docs
      .map(doc => ({
        _id: doc.id,
        ...doc.data()
      }))
      .sort((a, b) => {
        const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : a.createdAt;
        const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : b.createdAt;
        return (dateB || 0) - (dateA || 0);
      })
      .slice(0, 20);

    const unreadSnap = await db.collection('notifications')
      .where('user', '==', req.user._id)
      .where('isRead', '==', false)
      .get();

    const unreadCount = unreadSnap.size;

    res.json({ success: true, notifications, unreadCount });
  } catch (error) {
    console.error('GetNotifications error:', error);
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
    const snapshot = await db.collection('notifications')
      .where('user', '==', req.user._id)
      .where('isRead', '==', false)
      .get();

    const batch = db.batch();
    snapshot.docs.forEach(doc => {
      batch.update(doc.ref, { isRead: true });
    });
    await batch.commit();

    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    console.error('MarkNotificationsRead error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = { getStats, getNotifications, markNotificationsRead };
