/**
 * Community Controller (Firebase Firestore Implementation)
 * Handles community/group CRUD and membership operations
 */

const { db, admin } = require('../config/firebase');

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

    // Create community
    const newCommunity = {
      name,
      description: description || '',
      tags: tags || [],
      leader: req.user._id,
      members: [req.user._id],
      isPublic: true,
      avatar: '',
      pinnedMessages: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const docRef = await db.collection('communities').add(newCommunity);
    const communityId = docRef.id;

    // Add community to user's joined list
    await db.collection('users').doc(req.user._id).update({
      joinedCommunities: admin.firestore.FieldValue.arrayUnion(communityId)
    });

    // Create system message
    const newMessage = {
      community: communityId,
      sender: req.user._id,
      content: `${req.user.name} created the group "${name}"`,
      type: 'system',
      createdAt: new Date()
    };

    await db.collection('messages').add(newMessage);

    // Populate leader and members (Manual)
    const leaderDoc = await db.collection('users').doc(req.user._id).get();
    const leader = { _id: leaderDoc.id, name: leaderDoc.data().name, email: leaderDoc.data().email, avatar: leaderDoc.data().avatar };

    res.status(201).json({ 
      success: true, 
      community: { 
        _id: communityId, 
        ...newCommunity, 
        leader,
        members: [leader] // Initially only the creator
      } 
    });
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
    const snapshot = await db.collection('communities')
      .where('isPublic', '==', true)
      .get();

    const communities = await Promise.all(snapshot.docs.map(async (doc) => {
      const data = doc.data();
      
      const leaderDoc = await db.collection('users').doc(data.leader).get();
      const leader = leaderDoc.exists ? { _id: leaderDoc.id, name: leaderDoc.data().name, avatar: leaderDoc.data().avatar } : null;
      
      return { _id: doc.id, ...data, leader };
    }));

    // Sort by createdAt manually
    communities.sort((a, b) => {
      const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : a.createdAt;
      const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : b.createdAt;
      return (dateB || 0) - (dateA || 0);
    });

    res.json({ success: true, communities });
  } catch (error) {
    console.error('GetAllCommunities error:', error);
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
    const snapshot = await db.collection('communities')
      .where('members', 'array-contains', req.user._id)
      .get();

    const communities = await Promise.all(snapshot.docs.map(async (doc) => {
      const data = doc.data();
      const leaderDoc = await db.collection('users').doc(data.leader).get();
      const leader = leaderDoc.exists ? { _id: leaderDoc.id, name: leaderDoc.data().name, avatar: leaderDoc.data().avatar } : null;
      
      return { _id: doc.id, ...data, leader };
    }));

    // Sort by updatedAt manually
    communities.sort((a, b) => b.updatedAt - a.updatedAt);

    res.json({ success: true, communities });
  } catch (error) {
    console.error('GetMyCommunities error:', error);
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
    const doc = await db.collection('communities').doc(req.params.id).get();

    if (!doc.exists) {
      return res.status(404).json({ success: false, message: 'Community not found' });
    }

    const data = doc.data();
    
    // Manual population
    const leaderDoc = await db.collection('users').doc(data.leader).get();
    const leader = leaderDoc.exists ? { _id: leaderDoc.id, ...leaderDoc.data() } : null;
    if (leader) delete leader.password;

    const memberPromises = data.members.map(id => db.collection('users').doc(id).get());
    const memberDocs = await Promise.all(memberPromises);
    const members = memberDocs
      .filter(d => d.exists)
      .map(d => {
        const m = { _id: d.id, ...d.data() };
        delete m.password;
        return m;
      });

    let pinnedMessages = [];
    if (data.pinnedMessages && data.pinnedMessages.length > 0) {
      const pinPromises = data.pinnedMessages.map(id => db.collection('messages').doc(id).get());
      const pinDocs = await Promise.all(pinPromises);
      pinnedMessages = await Promise.all(pinDocs
        .filter(d => d.exists)
        .map(async (d) => {
          const m = { _id: d.id, ...d.data() };
          const senderDoc = await db.collection('users').doc(m.sender).get();
          m.sender = senderDoc.exists ? { _id: senderDoc.id, name: senderDoc.data().name, avatar: senderDoc.data().avatar } : null;
          return m;
        }));
    }

    res.json({ 
      success: true, 
      community: { 
        _id: doc.id, 
        ...data, 
        leader, 
        members, 
        pinnedMessages 
      } 
    });
  } catch (error) {
    console.error('GetCommunity error:', error);
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
    const communityRef = db.collection('communities').doc(req.params.id);
    const doc = await communityRef.get();

    if (!doc.exists) {
      return res.status(404).json({ success: false, message: 'Community not found' });
    }

    const data = doc.data();

    // Check if already a member
    if (data.members.includes(req.user._id)) {
      return res.status(400).json({ success: false, message: 'Already a member of this community' });
    }

    // Add user to community members
    await communityRef.update({
      members: admin.firestore.FieldValue.arrayUnion(req.user._id),
      updatedAt: new Date()
    });

    // Add community to user's joined list
    await db.collection('users').doc(req.user._id).update({
      joinedCommunities: admin.firestore.FieldValue.arrayUnion(req.params.id)
    });

    // System message
    await db.collection('messages').add({
      community: req.params.id,
      sender: req.user._id,
      content: `${req.user.name} joined the group`,
      type: 'system',
      createdAt: new Date()
    });

    // Get updated community for response
    const updatedCommunity = await getCommunity(req, res);
    // getCommunity handles the response
  } catch (error) {
    console.error('JoinCommunity error:', error);
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
    const communityRef = db.collection('communities').doc(req.params.id);
    const doc = await communityRef.get();

    if (!doc.exists) {
      return res.status(404).json({ success: false, message: 'Community not found' });
    }

    const data = doc.data();

    // Leader cannot leave — they must transfer leadership first
    if (data.leader === req.user._id) {
      return res.status(400).json({
        success: false,
        message: 'Group leader cannot leave. Transfer leadership first.'
      });
    }

    // Remove user from members
    await communityRef.update({
      members: admin.firestore.FieldValue.arrayRemove(req.user._id),
      updatedAt: new Date()
    });

    // Remove community from user's list
    await db.collection('users').doc(req.user._id).update({
      joinedCommunities: admin.firestore.FieldValue.arrayRemove(req.params.id)
    });

    // System message
    await db.collection('messages').add({
      community: req.params.id,
      sender: req.user._id,
      content: `${req.user.name} left the group`,
      type: 'system',
      createdAt: new Date()
    });

    res.json({ success: true, message: 'Left community successfully' });
  } catch (error) {
    console.error('LeaveCommunity error:', error);
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
    const communityRef = db.collection('communities').doc(req.params.id);
    const doc = await communityRef.get();

    if (!doc.exists) {
      return res.status(404).json({ success: false, message: 'Community not found' });
    }

    const data = doc.data();

    // Only leader can remove members
    if (data.leader !== req.user._id) {
      return res.status(403).json({ success: false, message: 'Only the group leader can remove members' });
    }

    // Cannot remove self
    if (req.params.userId === req.user._id) {
      return res.status(400).json({ success: false, message: 'Cannot remove yourself' });
    }

    // Remove member
    await communityRef.update({
      members: admin.firestore.FieldValue.arrayRemove(req.params.userId),
      updatedAt: new Date()
    });

    // Remove from user's joined list
    await db.collection('users').doc(req.params.userId).update({
      joinedCommunities: admin.firestore.FieldValue.arrayRemove(req.params.id)
    });

    res.json({ success: true, message: 'Member removed successfully' });
  } catch (error) {
    console.error('RemoveMember error:', error);
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
    const queryStr = req.query.q;
    if (!queryStr) {
      return res.status(400).json({ success: false, message: 'Search query required' });
    }

    // In-memory filtering for simplicity in this project
    const snapshot = await db.collection('communities')
      .where('isPublic', '==', true)
      .limit(100)
      .get();

    const communities = await Promise.all(snapshot.docs
      .map(async (doc) => {
        const data = doc.data();
        if (
          data.name.toLowerCase().includes(queryStr.toLowerCase()) || 
          data.description.toLowerCase().includes(queryStr.toLowerCase())
        ) {
          const leaderDoc = await db.collection('users').doc(data.leader).get();
          const leader = leaderDoc.exists ? { _id: leaderDoc.id, name: leaderDoc.data().name, avatar: leaderDoc.data().avatar } : null;
          return { _id: doc.id, ...data, leader };
        }
        return null;
      }));

    const filtered = communities.filter(c => c !== null).slice(0, 20);

    res.json({ success: true, communities: filtered });
  } catch (error) {
    console.error('SearchCommunities error:', error);
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
