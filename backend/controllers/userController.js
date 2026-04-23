/**
 * User Controller (Firebase Firestore Implementation)
 * Handles user profile operations
 */

const { db, formatFirestoreData } = require('../config/firebase');

/**
 * @route   GET /api/users/:id
 * @desc    Get user profile by ID
 * @access  Private
 */
const getUserProfile = async (req, res) => {
  try {
    const userDoc = await db.collection('users').doc(req.params.id).get();

    if (!userDoc.exists) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const userData = formatFirestoreData(userDoc.data());
    const user = { _id: userDoc.id, ...userData };
    delete user.password;

    // Populate joinedCommunities (Manual in Firestore)
    if (user.joinedCommunities && user.joinedCommunities.length > 0) {
      const communityPromises = user.joinedCommunities.map(id => 
        db.collection('communities').doc(id).get()
      );
      const communityDocs = await Promise.all(communityPromises);
      user.joinedCommunities = communityDocs
        .filter(doc => doc.exists)
        .map(doc => formatFirestoreData({ _id: doc.id, ...doc.data() }));
    }

    // Get user certificates
    const certificatesSnapshot = await db.collection('certificates')
      .where('user', '==', userDoc.id)
      .orderBy('createdAt', 'desc')
      .get();
    
    const certificates = certificatesSnapshot.docs.map(doc => formatFirestoreData({
      _id: doc.id,
      ...doc.data()
    }));

    res.json({
      success: true,
      user,
      certificates
    });
  } catch (error) {
    console.error('GetUserProfile error:', error);
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

    const updateFields = {
      updatedAt: new Date()
    };
    if (name) updateFields.name = name;
    if (bloodGroup) updateFields.bloodGroup = bloodGroup;
    if (phone !== undefined) updateFields.phone = phone;
    if (location !== undefined) updateFields.location = location;
    if (bio !== undefined) updateFields.bio = bio;
    if (avatar !== undefined) updateFields.avatar = avatar;

    await db.collection('users').doc(req.user._id).update(updateFields);

    const updatedUserDoc = await db.collection('users').doc(req.user._id).get();
    const user = { _id: updatedUserDoc.id, ...updatedUserDoc.data() };
    delete user.password;

    res.json({ success: true, user });
  } catch (error) {
    console.error('UpdateProfile error:', error);
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

    // Firestore doesn't support case-insensitive regex search natively.
    // For this simple app, we'll fetch all and filter in memory, or just do a prefix search.
    // Fetching and filtering is okay for small datasets.
    const snapshot = await db.collection('users').limit(100).get();
    
    const users = snapshot.docs
      .map(doc => ({
        _id: doc.id,
        ...doc.data()
      }))
      .filter(user => 
        user.name.toLowerCase().includes(query.toLowerCase()) || 
        user.email.toLowerCase().includes(query.toLowerCase())
      )
      .slice(0, 20)
      .map(user => {
        delete user.password;
        return user;
      });

    res.json({ success: true, users });
  } catch (error) {
    console.error('SearchUsers error:', error);
    res.status(500).json({ success: false, message: 'Server error searching users' });
  }
};

module.exports = { getUserProfile, updateProfile, searchUsers };
