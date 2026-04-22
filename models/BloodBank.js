/**
 * BloodBank Model
 * Stores information about nearby blood banks and hospitals
 */

const mongoose = require('mongoose');

const bloodBankSchema = new mongoose.Schema({
  // Basic Info
  name: {
    type: String,
    required: [true, 'Blood bank name is required'],
    trim: true
  },
  address: {
    type: String,
    default: ''
  },
  city: {
    type: String,
    required: [true, 'City is required'],
    trim: true
  },
  state: {
    type: String,
    default: ''
  },

  // Contact
  phone: {
    type: String,
    default: ''
  },
  email: {
    type: String,
    default: ''
  },

  // Location Coordinates
  latitude: {
    type: Number,
    default: 0
  },
  longitude: {
    type: Number,
    default: 0
  },

  // Availability
  availableGroups: [{
    type: String,
    enum: ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-']
  }],

  // Operating Hours
  operatingHours: {
    type: String,
    default: '24/7'
  },

  // Type
  type: {
    type: String,
    enum: ['blood_bank', 'hospital', 'donation_center'],
    default: 'blood_bank'
  },

  // Status
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for city search
bloodBankSchema.index({ city: 'text', name: 'text' });

module.exports = mongoose.model('BloodBank', bloodBankSchema);
