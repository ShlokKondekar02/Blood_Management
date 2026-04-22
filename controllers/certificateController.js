/**
 * Certificate Controller
 * Handles donation certificate upload and management
 */

const Certificate = require('../models/Certificate');
const User = require('../models/User');

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

    const certificate = await Certificate.create({
      user: req.user._id,
      title: title || 'Donation Certificate',
      fileUrl: `/uploads/${req.file.filename}`,
      donationDate: donationDate || Date.now(),
      hospitalName: hospitalName || '',
      bloodGroup: bloodGroup || req.user.bloodGroup
    });

    // Increment user's donation count
    await User.findByIdAndUpdate(req.user._id, {
      $inc: { donationCount: 1 }
    });

    // Check if user should get verified badge (3+ donations)
    const certCount = await Certificate.countDocuments({ user: req.user._id });
    if (certCount >= 3) {
      await User.findByIdAndUpdate(req.user._id, {
        isVerifiedDonor: true
      });
    }

    res.status(201).json({ success: true, certificate });
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
    const certificates = await Certificate.find({ user: req.user._id })
      .sort({ donationDate: -1 });

    res.json({ success: true, certificates });
  } catch (error) {
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
    const certificates = await Certificate.find({
      user: req.params.userId,
      isVerified: true
    }).sort({ donationDate: -1 });

    res.json({ success: true, certificates });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = { uploadCertificate, getMyCertificates, getUserCertificates };
