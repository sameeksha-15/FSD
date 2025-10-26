const express = require('express');
const router = express.Router();
const Leave = require('../models/Leave');
const LeaveRequest = require('../models/LeaveRequest');
const { verifyToken, requireRole } = require('../middleware/authMiddleware');

// Worker submits a leave request (old model - keeping for compatibility)
router.post('/', verifyToken, requireRole('Worker'), async (req, res) => {
  const { date, reason } = req.body;
  const leaveRequest = new LeaveRequest({
    userId: req.user._id,
    date,
    reason
  });
  try {
    const savedRequest = await leaveRequest.save();
    res.status(201).json(savedRequest);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Admin/Manager view all leave requests (old model)
router.get('/', verifyToken, requireRole('Admin', 'Manager'), async (req, res) => {
  try {
    const requests = await LeaveRequest.find().populate('userId', 'username role');
    res.json(requests);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Admin/Manager update leave request status (old model)
router.patch('/:id', verifyToken, requireRole('Admin', 'Manager'), async (req, res) => {
  try {
    const { status } = req.body;
    const request = await LeaveRequest.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    if (!request) return res.status(404).json({ message: 'Leave request not found' });
    res.json(request);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// NEW ROUTES FOR EXPANDED FUNCTIONALITY

// Employee applies for leave (new model with date range)
router.post('/apply', verifyToken, async (req, res) => {
  try {
    console.log('User in token:', req.user);
    console.log('Request body:', req.body);
    
    const { reason, fromDate, toDate, userId } = req.body;
    
    // Use the user ID from the token if available, otherwise use the one from the request body
    const effectiveUserId = req.user?._id || userId;
    
    if (!effectiveUserId) {
      return res.status(400).json({ message: 'User ID is required' });
    }
    
    console.log('Using user ID:', effectiveUserId);
    
    const leave = new Leave({
      userId: effectiveUserId,
      reason,
      fromDate,
      toDate,
    });
    
    const savedLeave = await leave.save();
    console.log('Leave saved:', savedLeave);
    
    // Populate user data before emitting
    const populatedLeave = await Leave.findById(savedLeave._id)
      .populate('userId', 'username name role');
    
    console.log('Populated leave for WebSocket:', populatedLeave);
    
    // Emit WebSocket event for new leave application
    const io = req.app.get('io');
    console.log('IO instance:', io ? 'Available' : 'Not available');
    
    if (io) {
      console.log('🚀 Emitting leaveApplied event to all clients');
      io.emit('leaveApplied', {
        leave: populatedLeave,
        message: 'New leave application submitted'
      });
      console.log('✅ leaveApplied event emitted');
    } else {
      console.error('❌ Socket.IO not available - cannot emit event');
    }
    
    res.status(201).json({ 
      message: 'Leave applied successfully',
      leaveId: savedLeave._id
    });
  } catch (err) {
    console.error('Error applying for leave:', err);
    res.status(500).json({ message: err.message });
  }
});

// Employee views their own leave requests
router.get('/my-leaves', verifyToken, async (req, res) => {
  try {
    console.log('User ID from token:', req.user?._id);
    
    if (!req.user || !req.user._id) {
      return res.status(401).json({ message: 'User identification missing' });
    }
    
    const leaves = await Leave.find({ userId: req.user._id });
    console.log('Found leaves:', leaves.length);
    
    res.json(leaves);
  } catch (err) {
    console.error('Error fetching leaves:', err);
    res.status(500).json({ message: err.message });
  }
});

// Admin/Manager view all leave requests (new model)
router.get('/admin', verifyToken, requireRole('Admin', 'Manager'), async (req, res) => {
  try {
    const leaves = await Leave.find().populate('userId', 'username name role');
    res.json(leaves);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update leave status (used by LeaveManagement component)
router.put('/:id/status', verifyToken, requireRole('Admin', 'Manager'), async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!['Approved', 'Rejected', 'Pending'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status value' });
    }
    
    const leave = await Leave.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    ).populate('userId', 'username name role');
    
    if (!leave) {
      return res.status(404).json({ message: 'Leave request not found' });
    }
    
    console.log('Leave status updated:', leave);
    
    // Emit WebSocket event for leave status update
    const io = req.app.get('io');
    console.log('IO instance for status update:', io ? 'Available' : 'Not available');
    
    if (io) {
      console.log('🚀 Emitting leaveStatusUpdated event to all clients');
      io.emit('leaveStatusUpdated', {
        leave,
        status,
        message: `Leave request ${status.toLowerCase()}`
      });
      console.log('✅ leaveStatusUpdated event emitted for leave ID:', leave._id);
    } else {
      console.error('❌ Socket.IO not available - cannot emit status update');
    }
    
    res.json(leave);
  } catch (err) {
    console.error('Error updating leave status:', err);
    res.status(500).json({ message: err.message });
  }
});

// Admin/Manager update leave status (keeping for compatibility)
router.patch('/admin/:id', verifyToken, requireRole('Admin', 'Manager'), async (req, res) => {
  try {
    const { status } = req.body;
    const leave = await Leave.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    ).populate('userId', 'username name role');
    
    if (!leave) return res.status(404).json({ message: 'Leave request not found' });
    
    // Emit WebSocket event for leave status update
    const io = req.app.get('io');
    if (io) {
      io.emit('leaveStatusUpdated', {
        leave,
        status,
        message: `Leave request ${status.toLowerCase()}`
      });
    }
    
    res.json(leave);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

module.exports = router; 