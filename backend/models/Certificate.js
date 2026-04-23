/**
 * Certificate Model
 * Stores blood donation certificates uploaded by users
 */

const mongoose = require('mongoose');

const certificateSchema = new mongoose.Schema({
  // Which user uploaded this
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // Certificate Details
  title: {
    type: String,
    required: [true, 'Certificate title is required'],
    trim: true,
    maxlength: 100
  },
  fileUrl: {
    type: String,
    required: [true, 'Certificate file is required']
  },

  // Donation Info
  donationDate: {
    type: Date,
    default: Date.now
  },
  hospitalName: {
    type: String,
    default: ''
  },
  bloodGroup: {
    type: String,
    enum: ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'],
    default: 'O+'
  },

  // Verification
  isVerified: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Certificate', certificateSchema);
