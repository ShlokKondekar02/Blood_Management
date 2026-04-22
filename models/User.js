/**
 * User Model
 * Stores user profile, authentication, and donation information
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  // Basic Info
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: 50
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: 6,
    select: false // Don't return password by default
  },

  // Blood & Health Info
  bloodGroup: {
    type: String,
    enum: ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'],
    default: 'O+'
  },
  phone: {
    type: String,
    default: ''
  },
  location: {
    type: String,
    default: ''
  },

  // Profile
  avatar: {
    type: String,
    default: '' // URL to avatar image
  },
  bio: {
    type: String,
    default: '',
    maxlength: 200
  },

  // Community & Donations
  joinedCommunities: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Community'
  }],
  donationCount: {
    type: Number,
    default: 0
  },
  isVerifiedDonor: {
    type: Boolean,
    default: false
  },

  // Status
  isOnline: {
    type: Boolean,
    default: false
  },
  lastSeen: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true // Adds createdAt and updatedAt automatically
});

/**
 * Hash password before saving to database
 */
userSchema.pre('save', async function(next) {
  // Only hash if password was modified
  if (!this.isModified('password')) return next();

  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

/**
 * Compare entered password with stored hashed password
 */
userSchema.methods.comparePassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
