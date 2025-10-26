const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const SiteMonitoring = require('../models/SiteMonitoring');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Create uploads directory if it doesn't exist
const uploadDir = path.join(__dirname, '../uploads/site-monitoring');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function(req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Not an image! Please upload only images.'), false);
    }
  }
});

// Middleware to check if user is supervisor or admin
const isSupervisorOrAdmin = (req, res, next) => {
  const allowedRoles = ['Admin', 'Manager', 'Supervisor'];
  if (!allowedRoles.includes(req.user.role)) {
    return res.status(403).json({ message: 'Access denied. Only Supervisors and Admins can access this resource.' });
  }
  next();
};

// Get all site monitoring reports
router.get('/', authMiddleware.verifyToken, async (req, res) => {
  try {
    const reports = await SiteMonitoring.find()
      .populate('reportedBy', 'username role')
      .populate('comments.author', 'username role')
      .sort({ createdAt: -1 });
    res.json(reports);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get a specific report
router.get('/:id', authMiddleware.verifyToken, async (req, res) => {
  try {
    const report = await SiteMonitoring.findById(req.params.id)
      .populate('reportedBy', 'username role')
      .populate('comments.author', 'username role');
    
    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }
    res.json(report);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create a new site monitoring report
router.post('/', 
  authMiddleware.verifyToken, 
  isSupervisorOrAdmin, 
  upload.array('photos', 5), 
  async (req, res) => {
  try {
    console.log('Creating new site monitoring report');
    console.log('Request body:', req.body);
    console.log('User info:', req.user);
    console.log('Files:', req.files);

    const { title, description, location, progress, status, reportedBy } = req.body;
    
    // Use either the reportedBy from the form or the authenticated user's ID
    const reporterId = reportedBy || req.user._id || req.user.id;
    console.log('Using reporter ID:', reporterId);

    const photos = req.files ? req.files.map(file => {
      // Extract just the filename and construct the relative path
      const filename = path.basename(file.path);
      const relativePath = `uploads/site-monitoring/${filename}`;
      console.log('Saving photo with path:', relativePath);
      return {
        path: relativePath,
        caption: ''
      };
    }) : [];
    
    console.log('Photos to save:', photos);

    const report = new SiteMonitoring({
      title,
      description,
      location,
      photos,
      progress: parseInt(progress),
      status,
      reportedBy: reporterId
    });

    console.log('Attempting to save report:', report);
    const savedReport = await report.save();
    console.log('Report saved successfully:', savedReport);
    res.status(201).json(savedReport);
  } catch (error) {
    console.error('Error saving report:', error);
    console.error('Validation errors:', error.errors);
    res.status(400).json({ message: error.message });
  }
});

// Get all site monitoring reports
router.get('/', authMiddleware.verifyToken, async function(req, res) {
  try {
    const reports = await SiteMonitoring.find()
      .populate('reportedBy', 'username role')
      .populate('comments.author', 'username role')
      .sort({ date: -1 });
    res.json(reports);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching site monitoring reports', error: error.message });
  }
});

// Get specific site monitoring report
router.get('/:id', authMiddleware.verifyToken, async function(req, res) {
  try {
    const report = await SiteMonitoring.findById(req.params.id)
      .populate('reportedBy', 'username role')
      .populate('comments.author', 'username role');
    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }
    res.json(report);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching site monitoring report', error: error.message });
  }
});

// Update site monitoring report
router.put('/:id', authMiddleware.verifyToken, isSupervisorOrAdmin, upload.array('photos', 5), async function(req, res) {
  try {
    const { title, description, location, progress, status, removedPhotos } = req.body;
    const report = await SiteMonitoring.findById(req.params.id);
    
    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    // Check if user is authorized to update
    if (report.reportedBy.toString() !== req.user.id && req.user.role !== 'Admin') {
      return res.status(403).json({ message: 'Not authorized to update this report' });
    }

    // Remove deleted photos
    if (removedPhotos) {
      const removedPhotoIds = JSON.parse(removedPhotos);
      report.photos = report.photos.filter(photo => !removedPhotoIds.includes(photo._id.toString()));
    }

    // Add new photos
    if (req.files && req.files.length > 0) {
      const newPhotos = req.files.map(file => {
        const filename = path.basename(file.path);
        const relativePath = `uploads/site-monitoring/${filename}`;
        console.log('Adding photo with path:', relativePath);
        return {
          path: relativePath,
          caption: ''
        };
      });
      report.photos.push(...newPhotos);
    }

    // Update other fields
    report.title = title || report.title;
    report.description = description || report.description;
    report.location = location || report.location;
    report.progress = progress ? parseInt(progress) : report.progress;
    report.status = status || report.status;

    await report.save();
    res.json(report);
  } catch (error) {
    res.status(500).json({ message: 'Error updating site monitoring report', error: error.message });
  }
});

// Add a comment to a report
router.post('/:id/comments', authMiddleware.verifyToken, async function(req, res) {
  try {
    const report = await SiteMonitoring.findById(req.params.id);
    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    report.comments.push({
      text: req.body.text,
      author: req.user.id
    });

    await report.save();
    
    const updatedReport = await SiteMonitoring.findById(req.params.id)
      .populate('comments.author', 'username role');
    
    const newComment = updatedReport.comments[updatedReport.comments.length - 1];
    res.json(newComment);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete a report
router.delete('/:id', authMiddleware.verifyToken, isSupervisorOrAdmin, async function(req, res) {
  try {
    const report = await SiteMonitoring.findById(req.params.id);
    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    if (report.reportedBy.toString() !== req.user.id && req.user.role !== 'Admin') {
      return res.status(403).json({ message: 'Not authorized to delete this report' });
    }

    // Delete associated photos
    report.photos.forEach(photo => {
      const fullPath = path.join(__dirname, '..', photo.path);
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
      }
    });

    await report.deleteOne();
    res.json({ message: 'Report deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;