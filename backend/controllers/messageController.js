/**
 * Message Controller (Firebase Firestore Implementation)
 * Handles chat messages within communities
 */

const { db, admin, formatFirestoreData } = require('../config/firebase');

/**
 * @route   GET /api/messages/:communityId
 * @desc    Get messages for a community (paginated)
 * @access  Private
 */
const getMessages = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    
    // Firestore pagination is slightly different, but for simplicity we'll just fetch and slice
    // or use offset if we must, though startAfter is better for Firestore.
    // For this app, we'll fetch ordered by createdAt.
    
    // Verify user is a member of the community
    const communityDoc = await db.collection('communities').doc(req.params.communityId).get();
    if (!communityDoc.exists) {
      return res.status(404).json({ success: false, message: 'Community not found' });
    }

    const communityData = communityDoc.data();
    if (!communityData.members || !communityData.members.includes(req.user._id)) {
      return res.status(403).json({ success: false, message: 'You are not a member of this community' });
    }

    const snapshot = await db.collection('messages')
      .where('community', '==', req.params.communityId)
      .get();

    const total = snapshot.size;
    const allMessages = snapshot.docs
      .map(doc => formatFirestoreData({ _id: doc.id, ...doc.data() }))
      .filter(msg => !msg.isDeleted);
    
    // Sort in memory
    allMessages.sort((a, b) => {
      const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : a.createdAt;
      const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : b.createdAt;
      return (dateA || 0) - (dateB || 0);
    });
    
    // Manual pagination in memory
    const skip = (page - 1) * limit;
    const paginatedMessages = allMessages.slice(skip, skip + limit);

    const populatedMessages = await Promise.all(paginatedMessages.map(async (m) => {
      const senderDoc = await db.collection('users').doc(m.sender).get();
      m.sender = senderDoc.exists ? { 
        _id: senderDoc.id, 
        name: senderDoc.data().name, 
        avatar: senderDoc.data().avatar, 
        bloodGroup: senderDoc.data().bloodGroup, 
        isVerifiedDonor: senderDoc.data().isVerifiedDonor 
      } : null;

      if (m.bloodRequest) {
        const brDoc = await db.collection('bloodRequests').doc(m.bloodRequest).get();
        if (brDoc.exists) {
          const brData = brDoc.data();
          const requesterDoc = await db.collection('users').doc(brData.requester).get();
          m.bloodRequest = {
            _id: brDoc.id,
            ...brData,
            requester: requesterDoc.exists ? { _id: requesterDoc.id, name: requesterDoc.data().name, avatar: requesterDoc.data().avatar } : null
          };
        }
      }
      return m;
    }));

    res.json({
      success: true,
      messages: populatedMessages,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('GetMessages error:', error);
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
    const communityRef = db.collection('communities').doc(communityId);
    const commDoc = await communityRef.get();
    if (!commDoc.exists) {
      return res.status(404).json({ success: false, message: 'Community not found' });
    }

    const community = commDoc.data();
    if (!community.members.includes(req.user._id)) {
      return res.status(403).json({ success: false, message: 'You are not a member of this community' });
    }

    // Create message
    const newMessage = {
      community: communityId,
      sender: req.user._id,
      content,
      type: type || 'text',
      bloodRequest: bloodRequest || null,
      isDeleted: false,
      isPinned: false,
      createdAt: new Date()
    };

    const docRef = await db.collection('messages').add(newMessage);
    const messageId = docRef.id;

    // Update community message count
    await communityRef.update({
      messageCount: admin.firestore.FieldValue.increment(1),
      updatedAt: new Date()
    });

    // Populate for response
    const userDoc = await db.collection('users').doc(req.user._id).get();
    const sender = { 
      _id: userDoc.id, 
      name: userDoc.data().name, 
      avatar: userDoc.data().avatar, 
      bloodGroup: userDoc.data().bloodGroup, 
      isVerifiedDonor: userDoc.data().isVerifiedDonor 
    };

    let populatedBloodRequest = null;
    if (bloodRequest) {
      const brDoc = await db.collection('bloodRequests').doc(bloodRequest).get();
      if (brDoc.exists) {
        const brData = brDoc.data();
        const requesterDoc = await db.collection('users').doc(brData.requester).get();
        populatedBloodRequest = {
          _id: brDoc.id,
          ...brData,
          requester: requesterDoc.exists ? { _id: requesterDoc.id, name: requesterDoc.data().name, avatar: requesterDoc.data().avatar } : null
        };
      }
    }

    res.status(201).json({ 
      success: true, 
      message: formatFirestoreData({ 
        _id: messageId, 
        ...newMessage, 
        sender, 
        bloodRequest: populatedBloodRequest 
      }) 
    });
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
    const messageRef = db.collection('messages').doc(req.params.id);
    const mDoc = await messageRef.get();
    if (!mDoc.exists) {
      return res.status(404).json({ success: false, message: 'Message not found' });
    }

    const message = mDoc.data();

    // Check if user is community leader
    const communityRef = db.collection('communities').doc(message.community);
    const commDoc = await communityRef.get();
    if (commDoc.data().leader !== req.user._id) {
      return res.status(403).json({ success: false, message: 'Only the group leader can pin messages' });
    }

    // Toggle pin status
    const newPinnedStatus = !message.isPinned;
    await messageRef.update({ isPinned: newPinnedStatus });

    // Update community pinned messages list
    if (newPinnedStatus) {
      await communityRef.update({
        pinnedMessages: admin.firestore.FieldValue.arrayUnion(req.params.id)
      });
    } else {
      await communityRef.update({
        pinnedMessages: admin.firestore.FieldValue.arrayRemove(req.params.id)
      });
    }

    res.json({ success: true, message: { _id: mDoc.id, ...message, isPinned: newPinnedStatus } });
  } catch (error) {
    console.error('PinMessage error:', error);
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
    const messageRef = db.collection('messages').doc(req.params.id);
    const mDoc = await messageRef.get();
    if (!mDoc.exists) {
      return res.status(404).json({ success: false, message: 'Message not found' });
    }

    const message = mDoc.data();

    // Check if user is sender or community leader
    const communityRef = db.collection('communities').doc(message.community);
    const commDoc = await communityRef.get();
    
    const isLeader = commDoc.data().leader === req.user._id;
    const isSender = message.sender === req.user._id;

    if (!isLeader && !isSender) {
      return res.status(403).json({
        success: false,
        message: 'Only message sender or group leader can delete messages'
      });
    }

    // Soft delete
    await messageRef.update({
      isDeleted: true,
      content: 'This message has been deleted',
      updatedAt: new Date()
    });

    res.json({ success: true, message: 'Message deleted' });
  } catch (error) {
    console.error('DeleteMessage error:', error);
    res.status(500).json({ success: false, message: 'Server error deleting message' });
  }
};

module.exports = { getMessages, sendMessage, pinMessage, deleteMessage };
