/**
 * Auth Controller (Firebase Firestore Implementation)
 * Handles user registration, login, logout, and current user
 */

const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { validationResult } = require('express-validator');
const { db, formatFirestoreData } = require('../config/firebase');

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
    const usersRef = db.collection('users');
    const snapshot = await usersRef.where('email', '==', email.toLowerCase()).get();
    
    if (!snapshot.empty) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new user document
    const newUser = {
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      bloodGroup: bloodGroup || 'O+',
      phone: phone || '',
      location: location || '',
      avatar: '',
      bio: '',
      donationCount: 0,
      isVerifiedDonor: false,
      joinedCommunities: [],
      isOnline: false,
      lastSeen: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const docRef = await usersRef.add(newUser);
    const userId = docRef.id;

    // Send response (exclude password)
    res.status(201).json({
      success: true,
      message: 'Registration successful. Please log in to continue.',
      user: {
        _id: userId,
        name: newUser.name,
        email: newUser.email,
        bloodGroup: newUser.bloodGroup,
        phone: newUser.phone,
        location: newUser.location,
        avatar: newUser.avatar,
        donationCount: newUser.donationCount,
        isVerifiedDonor: newUser.isVerifiedDonor,
        joinedCommunities: newUser.joinedCommunities,
        createdAt: newUser.createdAt
      }
    });
  } catch (error) {
    console.error("REGISTER ERROR:", error);
    res.status(500).json({
      success: false,
      message: error.message
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

    // Find user
    const usersRef = db.collection('users');
    const userEmail = email ? email.trim().toLowerCase() : '';
    const snapshot = await usersRef.where('email', '==', userEmail).get();

    if (snapshot.empty) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    const userDoc = snapshot.docs[0];
    const user = formatFirestoreData(userDoc.data());
    const userId = userDoc.id;

    // Compare passwords
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Update online status
    await usersRef.doc(userId).update({
      isOnline: true,
      lastSeen: new Date()
    });

    // Generate token
    const token = generateToken(userId);

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
        _id: userId,
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
      await db.collection('users').doc(req.user._id).update({
        isOnline: false,
        lastSeen: new Date()
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
    const userDoc = await db.collection('users').doc(req.user._id).get();
    
    if (!userDoc.exists) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const user = formatFirestoreData({ _id: userDoc.id, ...userDoc.data() });
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

    res.json({ success: true, user });
  } catch (error) {
    console.error('GetMe error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = { register, login, logout, getMe };
