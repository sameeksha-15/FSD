const express = require('express');
const router = express.Router();
const Employee = require('../models/Employee');
const { verifyToken, requireRole } = require('../middleware/authMiddleware');
const Attendance = require('../models/Attendance');

// Get all employees (admin only)
router.get('/', verifyToken, requireRole('Admin', 'Manager'), async (req, res) => {
  try {
    const employees = await Employee.find();
    res.json(employees);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get profile for the currently logged-in employee
// IMPORTANT: Place this route BEFORE the /:id route to avoid path conflicts
router.get('/profile', verifyToken, async (req, res) => {
  try {
    console.log(`Finding employee profile for user ID: ${req.user._id}`);
    
    // Try to find the employee by userId
    let employee = await Employee.findOne({ userId: req.user._id });
    
    // If not found, try by name match
    if (!employee) {
      console.log("Not found by userId, trying name match");
      employee = await Employee.findOne({ 
        name: { $regex: new RegExp(`^${req.user.username}$`, 'i') }
      });
    }
    
    if (!employee) {
      console.log("Employee not found for user", req.user);
      
      // For development - create a test employee if one doesn't exist
      if (process.env.NODE_ENV !== 'production') {
        console.log("Creating a test employee record for this user");
        employee = new Employee({
          name: req.user.username,
          role: req.user.role === 'Admin' ? 'Manager' : 'Worker',
          salary: 15000, // Default test salary
          userId: req.user._id
        });
        await employee.save();
        console.log("Created test employee:", employee);
      } else {
        return res.status(404).json({ message: 'Employee profile not found' });
      }
    }
    
    // Get attendance info for current month
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    
    const attendance = await Attendance.find({
      employeeId: employee._id,
      date: { $gte: startOfMonth, $lte: endOfMonth }
    }).sort({ date: -1 });
    
    const presentDays = attendance.filter(a => a.status === 'Present').length;
    const dailyRate = employee.salary / 30;
    const totalSalary = dailyRate * presentDays;
    
    res.json({
      _id: employee._id,
      name: employee.name,
      role: employee.role,
      salary: employee.salary,
      userId: employee.userId,
      // Additional data
      attendance: {
        present: presentDays,
        total: attendance.length,
        rate: attendance.length ? (presentDays / attendance.length * 100).toFixed(0) : 0
      },
      pay: {
        dailyRate: dailyRate.toFixed(2),
        totalSalary: totalSalary.toFixed(2)
      }
    });
  } catch (err) {
    console.error("Error finding employee profile:", err);
    res.status(500).json({ message: err.message });
  }
});

// Get a specific employee by id
router.get('/:id', verifyToken, async (req, res) => {
  try {
    console.log(`Finding employee with ID: ${req.params.id}`);
    
    // First try finding by MongoDB ObjectId
    let employee = await Employee.findById(req.params.id);
    
    // If not found, try finding by userId reference
    if (!employee) {
      console.log("Not found by ObjectId, trying to find by userId reference");
      employee = await Employee.findOne({ userId: req.params.id });
    }
    
    // If still not found, try a looser query
    if (!employee) {
      console.log("Not found by userId reference, trying looser query");
      employee = await Employee.findOne({ 
        $or: [
          { userId: req.params.id },
          { _id: req.params.id }
        ]
      });
    }
    
    if (!employee) return res.status(404).json({ message: 'Employee not found' });
    
    console.log("Found employee:", employee);
    res.json(employee);
  } catch (err) {
    console.error("Error finding employee:", err);
    res.status(500).json({ message: err.message });
  }
});

// Create a new employee (admin only)
router.post('/', verifyToken, requireRole('Admin', 'Manager'), async (req, res) => {
  try {
    console.log('Creating new employee with data:', req.body);
    
    // Create employee object matching the schema
    const employee = new Employee({
      name: req.body.name,
      role: req.body.role || 'Worker',
      salary: req.body.salary
    });
    
    // Add userId if provided
    if (req.body.userId) {
      employee.userId = req.body.userId;
    }
    
    const newEmployee = await employee.save();
    console.log('Employee created successfully:', newEmployee);
    res.status(201).json(newEmployee);
  } catch (err) {
    console.error('Error creating employee:', err);
    res.status(400).json({ message: err.message });
  }
});

// Update an employee (admin only)
router.patch('/:id', verifyToken, requireRole('Admin', 'Manager'), async (req, res) => {
  try {
    const employee = await Employee.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!employee) return res.status(404).json({ message: 'Employee not found' });
    res.json(employee);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete an employee (admin only)
router.delete('/:id', verifyToken, requireRole('Admin', 'Manager'), async (req, res) => {
  try {
    const employee = await Employee.findByIdAndDelete(req.params.id);
    if (!employee) return res.status(404).json({ message: 'Employee not found' });
    res.json({ message: 'Employee deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router; 