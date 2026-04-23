/**
 * Socket.IO Handler (Firebase Firestore Implementation)
 * Manages real-time communication for chat and notifications
 */

const jwt = require('jsonwebtoken');
const { db } = require('../config/firebase');

const setupSocket = (io) => {
  // Authentication middleware for socket connections
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];

      if (!token) {
        return next(new Error('Authentication required'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const userDoc = await db.collection('users').doc(decoded.id).get();

      if (!userDoc.exists) {
        return next(new Error('User not found'));
      }

      const userData = userDoc.data();
      socket.user = { _id: userDoc.id, ...userData };
      delete socket.user.password;
      
      next();
    } catch (error) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', async (socket) => {
    console.log(`🔌 User connected: ${socket.user.name} (${socket.user._id})`);

    // Update user online status
    await db.collection('users').doc(socket.user._id).update({ 
      isOnline: true,
      lastSeen: new Date()
    });

    /**
     * Join a community room for real-time updates
     */
    socket.on('join_community', async (communityId) => {
      try {
        const commDoc = await db.collection('communities').doc(communityId).get();
        if (commDoc.exists && commDoc.data().members.includes(socket.user._id)) {
          socket.join(`community_${communityId}`);
          console.log(`📢 ${socket.user.name} joined community room: ${communityId}`);
        } else {
          console.warn(`⚠️ ${socket.user.name} attempted to join unauthorized room: ${communityId}`);
        }
      } catch (err) {
        console.error('Socket join error:', err);
      }
    });

    /**
     * Leave a community room
     */
    socket.on('leave_community', (communityId) => {
      socket.leave(`community_${communityId}`);
      console.log(`👋 ${socket.user.name} left community room: ${communityId}`);
    });

    /**
     * Handle new message — broadcast to community room
     */
    socket.on('send_message', async (data) => {
      const { communityId, message } = data;
      
      // Secondary check: verify sender is still a member before broadcasting
      try {
        const commDoc = await db.collection('communities').doc(communityId).get();
        if (commDoc.exists && commDoc.data().members.includes(socket.user._id)) {
          socket.to(`community_${communityId}`).emit('new_message', message);
        }
      } catch (err) {
        console.error('Socket send_message error:', err);
      }
    });

    /**
     * Handle blood request — alert community members
     */
    socket.on('blood_request', (data) => {
      const { communityId, request } = data;
      socket.to(`community_${communityId}`).emit('blood_request_alert', request);
    });

    /**
     * Handle quick reply to blood request
     */
    socket.on('new_reply', (data) => {
      const { communityId, reply } = data;
      socket.to(`community_${communityId}`).emit('reply_received', reply);
    });

    /**
     * Typing indicator
     */
    socket.on('typing', (data) => {
      const { communityId } = data;
      socket.to(`community_${communityId}`).emit('user_typing', {
        userId: socket.user._id,
        userName: socket.user.name
      });
    });

    /**
     * Stop typing indicator
     */
    socket.on('stop_typing', (data) => {
      const { communityId } = data;
      socket.to(`community_${communityId}`).emit('user_stop_typing', {
        userId: socket.user._id
      });
    });

    /**
     * Handle disconnect
     */
    socket.on('disconnect', async () => {
      console.log(`❌ User disconnected: ${socket.user.name}`);
      try {
        await db.collection('users').doc(socket.user._id).update({
          isOnline: false,
          lastSeen: new Date()
        });
      } catch (error) {
        console.error('Socket disconnect update error:', error);
      }
    });
  });
};

module.exports = setupSocket;
