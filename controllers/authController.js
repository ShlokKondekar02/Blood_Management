/**
 * Auth Controller
 * Handles user registration, login, logout, and current user
 */

const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const User = require('../models/User');

/**
 * Generate JWT Token
 */
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
};

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
const register = async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { name, email, password, bloodGroup, phone, location } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    // Create new user
    const user = await User.create({
      name,
      email,
      password,
      bloodGroup: bloodGroup || 'O+',
      phone: phone || '',
      location: location || ''
    });

    // Send response (exclude password)
    res.status(201).json({
      success: true,
      message: 'Registration successful. Please log in to continue.',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        bloodGroup: user.bloodGroup,
        phone: user.phone,
        location: user.location,
        avatar: user.avatar,
        donationCount: user.donationCount,
        isVerifiedDonor: user.isVerifiedDonor,
        joinedCommunities: user.joinedCommunities,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
  console.error("REGISTER FULL ERROR:", error);
  res.status(500).json({
    success:false,
    message:error.message
  });
}
};

/**
 * @route   POST /api/auth/login
 * @desc    Login user and return JWT
 * @access  Public
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    // Find user with password field
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Compare passwords
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Update online status
    user.isOnline = true;
    await user.save();

    // Generate token
    const token = generateToken(user._id);

    // Set cookie
    res.cookie('token', token, {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000,
      sameSite: 'lax'
    });

    res.json({
      success: true,
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        bloodGroup: user.bloodGroup,
        phone: user.phone,
        location: user.location,
        avatar: user.avatar,
        bio: user.bio,
        donationCount: user.donationCount,
        isVerifiedDonor: user.isVerifiedDonor,
        joinedCommunities: user.joinedCommunities,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Server error during login' });
  }
};

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user and clear cookie
 * @access  Private
 */
const logout = async (req, res) => {
  try {
    // Update online status
    if (req.user) {
      await User.findByIdAndUpdate(req.user._id, {
        isOnline: false,
        lastSeen: Date.now()
      });
    }

    res.cookie('token', '', {
      httpOnly: true,
      expires: new Date(0)
    });

    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error during logout' });
  }
};

/**
 * @route   GET /api/auth/me
 * @desc    Get current logged-in user
 * @access  Private
 */
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('joinedCommunities', 'name avatar members');

    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = { register, login, logout, getMe };
