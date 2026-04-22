/**
 * Notification Model
 * Stores user notifications for various events
 */

const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  // Who receives this notification
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // Notification Type
  type: {
    type: String,
    enum: ['blood_request', 'reply', 'community', 'system', 'certificate'],
    required: true
  },

  // Content
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },

  // Navigation link
  link: {
    type: String,
    default: ''
  },

  // Read status
  isRead: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Index for fetching user notifications
notificationSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
