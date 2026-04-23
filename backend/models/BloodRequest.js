/**
 * Blood Request Model
 * Stores urgent blood donation requests
 */

const mongoose = require('mongoose');

const bloodRequestSchema = new mongoose.Schema({
  // Who is requesting
  requester: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // Which community (optional - can be global)
  community: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Community',
    default: null
  },

  // Blood Details
  bloodGroup: {
    type: String,
    required: [true, 'Blood group is required'],
    enum: ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-']
  },
  unitsNeeded: {
    type: Number,
    default: 1,
    min: 1,
    max: 10
  },

  // Urgency Level
  urgency: {
    type: String,
    enum: ['critical', 'urgent', 'normal'],
    default: 'urgent'
  },

  // Location Details
  location: {
    type: String,
    required: [true, 'Location is required']
  },
  hospitalName: {
    type: String,
    default: ''
  },

  // Contact
  contactNumber: {
    type: String,
    required: [true, 'Contact number is required']
  },
  description: {
    type: String,
    default: '',
    maxlength: 500
  },

  // Request Type
  requestType: {
    type: String,
    enum: ['self', 'family', 'friend', 'other'],
    default: 'self'
  },

  // Status
  status: {
    type: String,
    enum: ['open', 'accepted', 'completed', 'cancelled'],
    default: 'open'
  },

  // Who accepted/responded
  acceptedBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }]
}, {
  timestamps: true
});

// Index for searching open requests
bloodRequestSchema.index({ status: 1, bloodGroup: 1, createdAt: -1 });

module.exports = mongoose.model('BloodRequest', bloodRequestSchema);
