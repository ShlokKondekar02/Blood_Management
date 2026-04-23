/**
 * Reply Controller (Firebase Firestore Implementation)
 * Handles quick replies to blood requests
 */

const { db, admin } = require('../config/firebase');

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
    const requestRef = db.collection('bloodRequests').doc(bloodRequestId);
    const doc = await requestRef.get();
    if (!doc.exists) {
      return res.status(404).json({ success: false, message: 'Blood request not found' });
    }

    const bloodRequest = doc.data();

    // Create reply
    const newReply = {
      bloodRequest: bloodRequestId,
      user: req.user._id,
      type,
      message: message || '',
      createdAt: new Date()
    };

    const replyRef = await db.collection('replies').add(newReply);
    const replyId = replyRef.id;

    // Add user to acceptedBy list if "can_donate"
    if (type === 'can_donate') {
      await requestRef.update({
        acceptedBy: admin.firestore.FieldValue.arrayUnion(req.user._id),
        status: 'accepted',
        updatedAt: new Date()
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

    await db.collection('notifications').add({
      user: bloodRequest.requester,
      type: 'reply',
      title: 'New Reply to Your Blood Request',
      message: `${req.user.name} ${replyLabels[type] || 'replied to your request'}`,
      link: `/blood-request/${bloodRequestId}`,
      isRead: false,
      createdAt: new Date()
    });

    const userDoc = await db.collection('users').doc(req.user._id).get();
    const userData = userDoc.data();
    delete userData.password;

    res.status(201).json({ 
      success: true, 
      reply: { 
        _id: replyId, 
        ...newReply, 
        user: { _id: userDoc.id, ...userData } 
      } 
    });
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
    const snapshot = await db.collection('replies')
      .where('bloodRequest', '==', req.params.requestId)
      .orderBy('createdAt', 'desc')
      .get();

    const replies = await Promise.all(snapshot.docs.map(async (doc) => {
      const data = doc.data();
      const userDoc = await db.collection('users').doc(data.user).get();
      const user = userDoc.exists ? { 
        _id: userDoc.id, 
        name: userDoc.data().name, 
        avatar: userDoc.data().avatar, 
        bloodGroup: userDoc.data().bloodGroup, 
        phone: userDoc.data().phone, 
        isVerifiedDonor: userDoc.data().isVerifiedDonor, 
        location: userDoc.data().location 
      } : null;

      return { _id: doc.id, ...data, user };
    }));

    res.json({ success: true, replies });
  } catch (error) {
    console.error('GetReplies error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = { createReply, getReplies };
