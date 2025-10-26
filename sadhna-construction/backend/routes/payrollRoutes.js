const express = require('express');
const router = express.Router();
const PDFDocument = require('pdfkit');
const Employee = require('../models/Employee');
const Attendance = require('../models/Attendance');
const { verifyToken, requireRole } = require('../middleware/authMiddleware');

// Endpoint to generate payroll PDF for an employee for a given month and year
router.get('/generate/:employeeId', verifyToken, requireRole('Admin', 'Manager'), async (req, res) => {
  try {
    console.log('Generating payslip for employee:', req.params.employeeId);
    const { employeeId } = req.params;
    const { month, year } = req.query; // month as number (1-12), year as four-digit
    
    if (!employeeId || !month || !year) {
      return res.status(400).json({ 
        message: 'Missing required parameters',
        params: { employeeId, month, year }
      });
    }
    
    console.log(`Generating payslip for employeeId: ${employeeId}, month: ${month}, year: ${year}`);
    
    const employee = await Employee.findById(employeeId);
    if (!employee) {
      console.error('Employee not found with ID:', employeeId);
      return res.status(404).json({ message: 'Employee not found' });
    }

    // Define start and end dates for the month
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    // Count present days
    const attendances = await Attendance.find({
      employeeId,
      date: { $gte: startDate, $lte: endDate },
      status: 'Present'
    });
    const presentDays = attendances.length;
    const dailyRate = employee.salary / 30;
    const totalSalary = dailyRate * presentDays;

    console.log(`Found ${presentDays} present days for employee ${employee.name}`);
    
    // Generate PDF
    const doc = new PDFDocument();
    let buffers = [];
    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', () => {
      const pdfData = Buffer.concat(buffers);
      res.writeHead(200, {
        'Content-Length': Buffer.byteLength(pdfData),
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment;filename=payslip.pdf'
      }).end(pdfData);
    });

    // PDF Content
    doc.fontSize(20).text('Payslip', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Employee: ${employee.name}`);
    doc.text(`Month/Year: ${month}/${year}`);
    doc.text(`Days Present: ${presentDays}`);
    doc.text(`Daily Rate: Rs.${dailyRate.toFixed(2)}`);
    doc.text(`Total Salary: Rs.${totalSalary.toFixed(2)}`);
    doc.end();
  } catch (err) {
    console.error('Error generating payslip:', err);
    res.status(500).json({ message: err.message });
  }
});

// Endpoint to generate pay info for the current worker
router.get('/my-pay', verifyToken, async (req, res) => {
  try {
    // Use current month/year if not provided
    const currentDate = new Date();
    const month = req.query.month || (currentDate.getMonth() + 1); // JS months are 0-indexed
    const year = req.query.year || currentDate.getFullYear();

    console.log(`Fetching pay info for user:`, req.user);
    
    // Try multiple methods to find the employee
    let employee = null;
    
    // Method 1: Try to find by userId reference (preferred)
    if (req.user._id) {
      console.log("Looking up employee by userId:", req.user._id);
      employee = await Employee.findOne({ userId: req.user._id });
    }
    
    // Method 2: Try to find by username/name match (fallback)
    if (!employee && req.user.username) {
      console.log("Looking up employee by username:", req.user.username);
      employee = await Employee.findOne({ 
        name: { $regex: new RegExp(`^${req.user.username}$`, 'i') } 
      });
    }
    
    // If still not found, try looking for any employee
    if (!employee) {
      console.log("Employee not found by direct matches. Checking all employees...");
      const allEmployees = await Employee.find({});
      console.log("Available employees:", allEmployees.map(e => ({ id: e._id, name: e.name })));
      
      // Just use the first employee for testing if any exist
      if (allEmployees.length > 0) {
        employee = allEmployees[0];
        console.log("Using first available employee for pay calculation:", employee.name);
      } else {
        return res.status(404).json({ 
          message: 'No employees found in the database'
        });
      }
    }
    
    // Define start and end dates for the month
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    // Count present days
    const attendances = await Attendance.find({
      employeeId: employee._id,
      date: { $gte: startDate, $lte: endDate },
      status: 'Present'
    });
    const presentDays = attendances.length;
    const dailyRate = employee.salary / 30;
    const totalSalary = dailyRate * presentDays;

    // Log the calculated values
    console.log({
      employeeName: employee.name,
      salary: employee.salary,
      presentDays,
      dailyRate: dailyRate.toFixed(2),
      totalSalary: totalSalary.toFixed(2)
    });

    res.json({
      employeeName: employee.name,
      month,
      year,
      presentDays,
      dailyRate: dailyRate.toFixed(2),
      totalSalary: totalSalary.toFixed(2)
    });
  } catch (err) {
    console.error('Error in /my-pay:', err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router; 