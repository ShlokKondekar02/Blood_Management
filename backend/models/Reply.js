/**
 * Reply Model
 * Quick replies to blood requests
 */

const mongoose = require('mongoose');

const replySchema = new mongoose.Schema({
  // Which blood request this reply is for
  bloodRequest: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'BloodRequest',
    required: true
  },

  // Who replied
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // Reply Type (quick reply options)
  type: {
    type: String,
    enum: ['can_donate', 'contact_me', 'nearby', 'hospital', 'blood_bank'],
    required: true
  },

  // Optional custom message
  message: {
    type: String,
    default: '',
    maxlength: 300
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Reply', replySchema);
