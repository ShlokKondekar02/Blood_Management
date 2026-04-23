/**
 * Authentication Middleware (Firebase Firestore Implementation)
 * Verifies JWT token and attaches user to request
 */

const jwt = require('jsonwebtoken');
const { db } = require('../config/firebase');

const protect = async (req, res, next) => {
  try {
    let token;

    // Check for token in Authorization header or cookies
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    // No token found
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized. Please login.'
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach user to request (exclude password)
    const userDoc = await db.collection('users').doc(decoded.id).get();

    if (!userDoc.exists) {
      return res.status(401).json({
        success: false,
        message: 'User not found. Token invalid.'
      });
    }

    req.user = { _id: userDoc.id, ...userDoc.data() };
    delete req.user.password;

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized. Token expired or invalid.'
    });
  }
};

module.exports = { protect };
