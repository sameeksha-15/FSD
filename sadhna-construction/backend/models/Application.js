const mongoose = require('mongoose');

const ApplicationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    trim: true
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },
  position: {
    type: String,
    required: true,
    trim: true
  },
  experience: {
    type: String,
    trim: true
  },
  message: {
    type: String,
    trim: true
  },
  // Personal details
  dateOfBirth: {
    type: Date
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other']
  },
  address: {
    type: String,
    trim: true
  },
  emergencyContact: {
    type: String,
    trim: true
  },
  // For login
  username: {
    type: String,
    trim: true
  },
  // Financial
  expectedSalary: {
    type: String,
    trim: true
  },
  // Document paths
  resumePath: {
    type: String
  },
  idProofPath: {
    type: String
  },
  addressProofPath: {
    type: String
  },
  policeVerificationPath: {
    type: String
  },
  photoPath: {
    type: String
  },
  // Application status
  status: {
    type: String,
    enum: ['Pending', 'Shortlisted', 'Rejected', 'Hired'],
    default: 'Pending'
  },
  applicationDate: {
    type: Date,
    default: Date.now
  },
  // For when an application is accepted and a user account is created
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  // For tracking application review
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  reviewDate: {
    type: Date,
    default: null
  },
  reviewComments: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Application', ApplicationSchema); 