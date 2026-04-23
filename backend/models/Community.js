/**
 * Community Model
 * Represents a blood donor group/community
 */

const mongoose = require('mongoose');

const communitySchema = new mongoose.Schema({
  // Group Info
  name: {
    type: String,
    required: [true, 'Community name is required'],
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    default: '',
    maxlength: 500
  },
  avatar: {
    type: String,
    default: '' // Group avatar URL
  },

  // Leadership & Membership
  leader: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  members: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],

  // Pinned Messages
  pinnedMessages: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  }],

  // Settings
  isPublic: {
    type: Boolean,
    default: true
  },
  tags: [{
    type: String,
    trim: true
  }],

  // Statistics
  messageCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Index for search functionality
communitySchema.index({ name: 'text', description: 'text' });

module.exports = mongoose.model('Community', communitySchema);
