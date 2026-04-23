/**
 * Blood Request Controller (Firebase Firestore Implementation)
 * Handles blood donation request CRUD operations
 */

const { db, formatFirestoreData } = require('../config/firebase');

/**
 * @route   POST /api/blood-requests
 * @desc    Create a new blood request
 * @access  Private
 */
const createBloodRequest = async (req, res) => {
  try {
    let createdMessage = null;
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
    const newRequest = {
      requester: req.user._id,
      community: communityId || null,
      bloodGroup,
      urgency: urgency || 'urgent',
      location,
      hospitalName: hospitalName || '',
      contactNumber,
      unitsNeeded: Number(unitsNeeded) || 1,
      description: description || '',
      requestType: requestType || 'self',
      status: 'open',
      acceptedBy: null,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const docRef = await db.collection('bloodRequests').add(newRequest);
    const requestId = docRef.id;

    // If community is specified, create an emergency message in the group
    if (communityId) {
      const urgencyLabel = urgency === 'critical' ? '🚨 CRITICAL' : urgency === 'urgent' ? '⚠️ URGENT' : '📋 NORMAL';
      const messageContent = `${urgencyLabel} BLOOD REQUEST\n\nRequester: ${req.user.name}\nBlood Group: ${bloodGroup}\nLocation: ${location}\nHospital: ${hospitalName || 'N/A'}\nUnits: ${unitsNeeded || 1}\nContact: ${contactNumber}\n\n${description || 'Please help if you can!'}`;

      const newMessage = {
        community: communityId,
        sender: req.user._id,
        content: messageContent,
        type: urgency === 'critical' ? 'emergency' : 'blood_request',
        bloodRequest: requestId,
        isDeleted: false,
        isPinned: false,
        createdAt: new Date()
      };

      const msgRef = await db.collection('messages').add(newMessage);
      createdMessage = formatFirestoreData({
        _id: msgRef.id,
        ...newMessage,
        sender: { _id: req.user._id, name: req.user.name, avatar: req.user.avatar || '' }
      });

      // Notify all community members
      const communityDoc = await db.collection('communities').doc(communityId).get();
      if (communityDoc.exists) {
        const community = communityDoc.data();
        const memberIds = community.members || [];
        
        const notifications = memberIds
          .filter(m => m !== req.user._id)
          .map(memberId => ({
            user: memberId,
            type: 'blood_request',
            title: `${urgencyLabel} Blood Request`,
            message: `${req.user.name} needs ${bloodGroup} blood at ${location}`,
            link: `/community/${communityId}`,
            isRead: false,
            createdAt: new Date()
          }));

        if (notifications.length > 0) {
          const batch = db.batch();
          notifications.forEach(notif => {
            const notifRef = db.collection('notifications').doc();
            batch.set(notifRef, notif);
          });
          await batch.commit();
        }
      }
    }

    const requesterDoc = await db.collection('users').doc(req.user._id).get();
    const requesterData = requesterDoc.data();
    delete requesterData.password;

    res.status(201).json({ 
      success: true, 
      bloodRequest: formatFirestoreData({ 
        _id: requestId, 
        ...newRequest, 
        requester: { _id: requesterDoc.id, ...requesterData } 
      }),
      message: createdMessage
    });
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
    let query = db.collection('bloodRequests');

    if (status) {
      query = query.where('status', '==', status);
    } else {
      // In Firestore, where in ['open', 'accepted']
      query = query.where('status', 'in', ['open', 'accepted']);
    }

    if (bloodGroup) {
      query = query.where('bloodGroup', '==', bloodGroup);
    }

    const snapshot = await query.get();
    
    const allDocs = snapshot.docs.map(doc => ({ _id: doc.id, ...doc.data() }));
    
    // Sort in memory
    allDocs.sort((a, b) => {
      const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : a.createdAt;
      const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : b.createdAt;
      return (dateB || 0) - (dateA || 0);
    });

    const requests = await Promise.all(allDocs.map(async (data) => {
      data = formatFirestoreData(data);
      
      // Manual population
      const requesterDoc = await db.collection('users').doc(data.requester).get();
      const requester = requesterDoc.exists ? formatFirestoreData({ _id: requesterDoc.id, name: requesterDoc.data().name, avatar: requesterDoc.data().avatar, bloodGroup: requesterDoc.data().bloodGroup, phone: requesterDoc.data().phone, location: requesterDoc.data().location }) : null;
      
      let community = null;
      if (data.community) {
        const commDoc = await db.collection('communities').doc(data.community).get();
        community = commDoc.exists ? formatFirestoreData({ _id: commDoc.id, name: commDoc.data().name }) : null;
      }

      let acceptedBy = null;
      if (data.acceptedBy) {
        const accDoc = await db.collection('users').doc(data.acceptedBy).get();
        acceptedBy = accDoc.exists ? formatFirestoreData({ _id: accDoc.id, name: accDoc.data().name, avatar: accDoc.data().avatar }) : null;
      }

      return {
        _id: data._id,
        ...data,
        requester,
        community,
        acceptedBy
      };
    }));

    res.json({ success: true, requests });
  } catch (error) {
    console.error('GetAllBloodRequests error:', error);
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
    const doc = await db.collection('bloodRequests').doc(req.params.id).get();

    if (!doc.exists) {
      return res.status(404).json({ success: false, message: 'Blood request not found' });
    }

    const data = doc.data();
    
    // Manual population
    const requesterDoc = await db.collection('users').doc(data.requester).get();
    const requester = requesterDoc.exists ? { _id: requesterDoc.id, name: requesterDoc.data().name, avatar: requesterDoc.data().avatar, bloodGroup: requesterDoc.data().bloodGroup, phone: requesterDoc.data().phone, location: requesterDoc.data().location } : null;
    
    let community = null;
    if (data.community) {
      const commDoc = await db.collection('communities').doc(data.community).get();
      community = commDoc.exists ? { _id: commDoc.id, name: commDoc.data().name } : null;
    }

    let acceptedBy = null;
    if (data.acceptedBy) {
      const accDoc = await db.collection('users').doc(data.acceptedBy).get();
      acceptedBy = accDoc.exists ? { _id: accDoc.id, name: accDoc.data().name, avatar: accDoc.data().avatar, phone: accDoc.data().phone, bloodGroup: accDoc.data().bloodGroup } : null;
    }

    res.json({ 
      success: true, 
      request: {
        _id: doc.id,
        ...data,
        requester,
        community,
        acceptedBy
      }
    });
  } catch (error) {
    console.error('GetBloodRequest error:', error);
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
    const requestRef = db.collection('bloodRequests').doc(req.params.id);
    const doc = await requestRef.get();

    if (!doc.exists) {
      return res.status(404).json({ success: false, message: 'Blood request not found' });
    }

    const data = doc.data();

    // Only requester can update status
    if (data.requester !== req.user._id) {
      return res.status(403).json({ success: false, message: 'Only requester can update status' });
    }

    await requestRef.update({
      status,
      updatedAt: new Date()
    });

    const updatedDoc = await requestRef.get();
    const updatedData = updatedDoc.data();

    // Population
    const requesterDoc = await db.collection('users').doc(updatedData.requester).get();
    const requester = requesterDoc.exists ? { _id: requesterDoc.id, name: requesterDoc.data().name, avatar: requesterDoc.data().avatar } : null;
    
    let acceptedBy = null;
    if (updatedData.acceptedBy) {
      const accDoc = await db.collection('users').doc(updatedData.acceptedBy).get();
      acceptedBy = accDoc.exists ? { _id: accDoc.id, name: accDoc.data().name, avatar: accDoc.data().avatar } : null;
    }

    res.json({ 
      success: true, 
      request: {
        _id: updatedDoc.id,
        ...updatedData,
        requester,
        acceptedBy
      }
    });
  } catch (error) {
    console.error('UpdateStatus error:', error);
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
    const snapshot = await db.collection('bloodRequests')
      .where('community', '==', req.params.communityId)
      .get();

    const allRequests = snapshot.docs.map(doc => ({ _id: doc.id, ...doc.data() }));
    
    // Sort in memory
    allRequests.sort((a, b) => {
      const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : a.createdAt;
      const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : b.createdAt;
      return (dateB || 0) - (dateA || 0);
    });

    const requests = await Promise.all(allRequests.map(async (data) => {
      const requesterDoc = await db.collection('users').doc(data.requester).get();
      const requester = requesterDoc.exists ? { _id: requesterDoc.id, name: requesterDoc.data().name, avatar: requesterDoc.data().avatar, bloodGroup: requesterDoc.data().bloodGroup } : null;
      
      let acceptedBy = null;
      if (data.acceptedBy) {
        const accDoc = await db.collection('users').doc(data.acceptedBy).get();
        acceptedBy = accDoc.exists ? { _id: accDoc.id, name: accDoc.data().name, avatar: accDoc.data().avatar } : null;
      }

      return {
        _id: data._id,
        ...data,
        requester,
        acceptedBy
      };
    }));

    res.json({ success: true, requests });
  } catch (error) {
    console.error('GetCommunityRequests error:', error);
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
