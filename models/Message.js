/**
 * Message Model
 * Stores chat messages within communities
 */

const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  // Association
  community: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Community',
    required: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // Content
  content: {
    type: String,
    required: [true, 'Message content is required'],
    maxlength: 2000
  },

  // Message Type
  type: {
    type: String,
    enum: ['text', 'blood_request', 'emergency', 'system'],
    default: 'text'
  },

  // Link to blood request if type is blood_request
  bloodRequest: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'BloodRequest',
    default: null
  },

  // Moderation
  isPinned: {
    type: Boolean,
    default: false
  },
  isDeleted: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Index for querying messages by community
messageSchema.index({ community: 1, createdAt: -1 });

module.exports = mongoose.model('Message', messageSchema);
