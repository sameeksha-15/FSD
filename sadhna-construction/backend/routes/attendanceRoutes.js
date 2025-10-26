const express = require('express');
const router = express.Router();
const Attendance = require('../models/Attendance');
const Employee = require('../models/Employee');
const { verifyToken, requireRole } = require('../middleware/authMiddleware');

// Get all attendance records
router.get('/', async (req, res) => {
  try {
    const attendance = await Attendance.find().populate('employeeId', 'name');
    res.json(attendance);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Add a new attendance record
router.post('/', async (req, res) => {
  const attendance = new Attendance({
    employeeId: req.body.employeeId,
    date: req.body.date,
    status: req.body.status
  });
  try {
    const newAttendance = await attendance.save();
    const populatedAttendance = await Attendance.findById(newAttendance._id).populate('employeeId', 'name');
    
    console.log('New attendance created:', populatedAttendance);
    
    // Emit WebSocket event for new attendance
    const io = req.app.get('io');
    console.log('IO instance for attendance:', io ? 'Available' : 'Not available');
    
    if (io) {
      console.log('🚀 Emitting attendanceAdded event to all clients');
      io.emit('attendanceAdded', {
        attendance: populatedAttendance,
        message: 'New attendance record added'
      });
      console.log('✅ attendanceAdded event emitted for:', populatedAttendance.employeeId?.name);
    } else {
      console.error('❌ Socket.IO not available - cannot emit attendance event');
    }
    
    res.status(201).json(newAttendance);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Worker/Supervisor/Manager fetches their own attendance records
router.get('/my-attendance', verifyToken, async (req, res) => {
  try {
    // Allow all non-admin roles to fetch their attendance
    if (req.user.role === 'Admin') {
      return res.status(403).json({ message: 'Admins should use the admin dashboard to view attendance' });
    }
    
    console.log(`Looking up employee for user: ${req.user.username} (ID: ${req.user._id})`);
    
    // Try multiple lookup methods
    let employee = null;
    
    // Method 1: Try to find by userId reference (most reliable)
    employee = await Employee.findOne({ userId: req.user._id });
    
    if (!employee) {
      // Method 2: Try exact name match (case insensitive)
      employee = await Employee.findOne({ 
        name: { $regex: new RegExp(`^${req.user.username}$`, 'i') } 
      });
    }
    
    if (!employee) {
      // Method 3: Try partial name match (username might be part of full name)
      employee = await Employee.findOne({ 
        name: { $regex: new RegExp(req.user.username, 'i') } 
      });
    }
    
    if (!employee) {
      console.log('Employee not found. Available employees:');
      const allEmployees = await Employee.find({}, 'name userId');
      console.log(allEmployees);
      
      return res.status(404).json({ 
        message: 'Employee record not found',
        username: req.user.username,
        userId: req.user._id
      });
    }

    console.log(`Found employee: ${employee.name} (ID: ${employee._id})`);
    const attendance = await Attendance.find({ employeeId: employee._id });
    console.log(`Found ${attendance.length} attendance records`);
    res.json(attendance);
  } catch (err) {
    console.error('Error in /my-attendance:', err);
    res.status(500).json({ message: err.message });
  }
});

// Get attendance records for a specific employee by ID
router.get('/employee/:employeeId', verifyToken, async (req, res) => {
  try {
    console.log('Fetching attendance for employee ID:', req.params.employeeId);
    
    // Validate that the employee exists
    const employee = await Employee.findById(req.params.employeeId);
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }
    
    // Find all attendance records for this employee
    const attendance = await Attendance.find({ 
      employeeId: req.params.employeeId 
    }).sort({ date: -1 });  // Sort by date, newest first
    
    console.log(`Found ${attendance.length} attendance records for employee ${employee.name}`);
    res.json(attendance);
  } catch (err) {
    console.error('Error fetching attendance records:', err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router; 