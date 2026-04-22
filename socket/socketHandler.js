/**
 * Socket.IO Handler
 * Manages real-time communication for chat and notifications
 */

const jwt = require('jsonwebtoken');
const User = require('../models/User');

const setupSocket = (io) => {
  // Authentication middleware for socket connections
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];

      if (!token) {
        return next(new Error('Authentication required'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');

      if (!user) {
        return next(new Error('User not found'));
      }

      socket.user = user;
      next();
    } catch (error) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', async (socket) => {
    console.log(`🔌 User connected: ${socket.user.name} (${socket.user._id})`);

    // Update user online status
    await User.findByIdAndUpdate(socket.user._id, { isOnline: true });

    /**
     * Join a community room for real-time updates
     */
    socket.on('join_community', (communityId) => {
      socket.join(`community_${communityId}`);
      console.log(`📢 ${socket.user.name} joined community room: ${communityId}`);
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
    socket.on('send_message', (data) => {
      const { communityId, message } = data;
      // Broadcast to all members in the community room (except sender)
      socket.to(`community_${communityId}`).emit('new_message', message);
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
      await User.findByIdAndUpdate(socket.user._id, {
        isOnline: false,
        lastSeen: Date.now()
      });
    });
  });
};

module.exports = setupSocket;
