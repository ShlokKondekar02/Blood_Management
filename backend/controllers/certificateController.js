/**
 * Certificate Controller (Firebase Firestore Implementation)
 * Handles donation certificate upload and management
 */

const { db, admin } = require('../config/firebase');

/**
 * @route   POST /api/certificates/upload
 * @desc    Upload a donation certificate
 * @access  Private
 */
const uploadCertificate = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please upload a file' });
    }

    const { title, donationDate, hospitalName, bloodGroup } = req.body;

    const newCertificate = {
      user: req.user._id,
      title: title || 'Donation Certificate',
      fileUrl: `/uploads/${req.file.filename}`,
      donationDate: donationDate ? new Date(donationDate) : new Date(),
      hospitalName: hospitalName || '',
      bloodGroup: bloodGroup || req.user.bloodGroup,
      isVerified: false,
      createdAt: new Date()
    };

    const docRef = await db.collection('certificates').add(newCertificate);
    const certificateId = docRef.id;

    // Increment user's donation count
    await db.collection('users').doc(req.user._id).update({
      donationCount: admin.firestore.FieldValue.increment(1)
    });

    // Check if user should get verified badge (3+ donations)
    const snapshot = await db.collection('certificates').where('user', '==', req.user._id).get();
    const certCount = snapshot.size;
    
    if (certCount >= 3) {
      await db.collection('users').doc(req.user._id).update({
        isVerifiedDonor: true
      });
    }

    res.status(201).json({ 
      success: true, 
      certificate: { _id: certificateId, ...newCertificate } 
    });
  } catch (error) {
    console.error('Upload certificate error:', error);
    res.status(500).json({ success: false, message: 'Server error uploading certificate' });
  }
};

/**
 * @route   GET /api/certificates/my
 * @desc    Get current user's certificates
 * @access  Private
 */
const getMyCertificates = async (req, res) => {
  try {
    const snapshot = await db.collection('certificates')
      .where('user', '==', req.user._id)
      .orderBy('donationDate', 'desc')
      .get();

    const certificates = snapshot.docs.map(doc => ({
      _id: doc.id,
      ...doc.data()
    }));

    res.json({ success: true, certificates });
  } catch (error) {
    console.error('GetMyCertificates error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * @route   GET /api/certificates/user/:userId
 * @desc    Get a user's public certificates
 * @access  Private
 */
const getUserCertificates = async (req, res) => {
  try {
    const snapshot = await db.collection('certificates')
      .where('user', '==', req.params.userId)
      .where('isVerified', '==', true)
      .orderBy('donationDate', 'desc')
      .get();

    const certificates = snapshot.docs.map(doc => ({
      _id: doc.id,
      ...doc.data()
    }));

    res.json({ success: true, certificates });
  } catch (error) {
    console.error('GetUserCertificates error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = { uploadCertificate, getMyCertificates, getUserCertificates };
