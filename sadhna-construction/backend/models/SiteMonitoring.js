const mongoose = require('mongoose');

const siteMonitoringSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  location: { type: String, required: true },
  photos: [{ 
    path: { type: String, required: true },
    caption: { type: String }
  }],
  progress: { type: Number, required: true, min: 0, max: 100 },
  status: { 
    type: String, 
    enum: ['In Progress', 'Completed', 'On Hold', 'Delayed'],
    default: 'In Progress'
  },
  reportedBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    required: true
  },
  date: { type: Date, default: Date.now },
  comments: [{
    text: { type: String, required: true },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    timestamp: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

module.exports = mongoose.model('SiteMonitoring', siteMonitoringSchema);