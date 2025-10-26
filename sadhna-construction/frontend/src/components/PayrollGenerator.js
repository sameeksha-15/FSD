import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import '../styles/payroll-generator.css';

const PayrollGenerator = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [employeeDetails, setEmployeeDetails] = useState(null);
  const [attendanceData, setAttendanceData] = useState(null);

  const [payrollData, setPayrollData] = useState({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    payPeriod: `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`,
    basicSalary: 0,
    daysWorked: 0,
    overtimeHours: 0,
    overtimeRate: 1.5,
    bonus: 0,
    deductions: 0,
    taxRate: 10, // Default tax rate (10%)
  });

  const [calculatedPayroll, setCalculatedPayroll] = useState(null);

  // Months for dropdown
  const months = [
    { value: 1, label: 'January' },
    { value: 2, label: 'February' },
    { value: 3, label: 'March' },
    { value: 4, label: 'April' },
    { value: 5, label: 'May' },
    { value: 6, label: 'June' },
    { value: 7, label: 'July' },
    { value: 8, label: 'August' },
    { value: 9, label: 'September' },
    { value: 10, label: 'October' },
    { value: 11, label: 'November' },
    { value: 12, label: 'December' },
  ];

  // Years for dropdown (current year and 2 previous years)
  const currentYear = new Date().getFullYear();
  const years = [currentYear, currentYear - 1, currentYear - 2];

  // Fetch all employees
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        if (!token) {
          toast.error('Authentication token missing. Please login again.');
          return;
        }

        const response = await axios.get('http://localhost:5000/api/employees', {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (response.data && Array.isArray(response.data)) {
          setEmployees(response.data);
        }
      } catch (error) {
        console.error('Error fetching employees:', error);
        toast.error(error.response?.data?.message || 'Failed to fetch employees');
      } finally {
        setLoading(false);
      }
    };

    fetchEmployees();
  }, []);

  // Fetch employee details and attendance when an employee is selected
  useEffect(() => {
    if (selectedEmployee) {
      fetchEmployeeDetails();
      fetchAttendanceData();
    }
  }, [selectedEmployee, payrollData.month, payrollData.year]);

  const fetchEmployeeDetails = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await axios.get(`http://localhost:5000/api/employees/${selectedEmployee}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data) {
        setEmployeeDetails(response.data);
        // Update basic salary from employee data
        setPayrollData(prev => ({
          ...prev,
          basicSalary: response.data.salary || 0
        }));
      }
    } catch (error) {
      console.error('Error fetching employee details:', error);
      toast.error('Failed to fetch employee details');
    } finally {
      setLoading(false);
    }
  };

  const fetchAttendanceData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      // Format month and year for API request
      const monthStr = String(payrollData.month).padStart(2, '0');
      const yearStr = String(payrollData.year);
      
      const response = await axios.get(
        `http://localhost:5000/api/attendance/employee/${selectedEmployee}/month/${yearStr}-${monthStr}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data) {
        setAttendanceData(response.data);
        
        // Count present days
        const presentDays = response.data.filter(record => 
          record.status === 'present'
        ).length;
        
        setPayrollData(prev => ({
          ...prev,
          daysWorked: presentDays
        }));
      }
    } catch (error) {
      console.error('Error fetching attendance data:', error);
      toast.error('Failed to fetch attendance data');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'payPeriod') {
      const [year, month] = value.split('-');
      setPayrollData(prev => ({
        ...prev,
        payPeriod: value,
        month: parseInt(month),
        year: parseInt(year)
      }));
    } else {
      setPayrollData(prev => ({
        ...prev,
        [name]: name === 'selectedEmployee' ? value : parseFloat(value) || 0
      }));
    }
  };

  const handleEmployeeChange = (e) => {
    setSelectedEmployee(e.target.value);
  };

  const calculatePayroll = () => {
    if (!selectedEmployee || !employeeDetails) {
      toast.error('Please select an employee first');
      return;
    }

    // Get values from state
    const {
      basicSalary,
      daysWorked,
      overtimeHours,
      overtimeRate,
      bonus,
      deductions,
      taxRate
    } = payrollData;

    // Calculate daily rate (assuming 30 days in a month)
    const dailyRate = basicSalary / 30;
    
    // Calculate base pay for days worked
    const basePay = dailyRate * daysWorked;
    
    // Calculate overtime pay
    const overtimePay = (dailyRate / 8) * overtimeHours * overtimeRate;
    
    // Calculate gross pay
    const grossPay = basePay + overtimePay + bonus;
    
    // Calculate tax amount
    const taxAmount = (grossPay * taxRate) / 100;
    
    // Calculate total deductions
    const totalDeductions = deductions + taxAmount;
    
    // Calculate net pay
    const netPay = grossPay - totalDeductions;

    // Set calculated payroll
    setCalculatedPayroll({
      employeeName: employeeDetails.name,
      employeeId: employeeDetails._id,
      designation: employeeDetails.role || 'Employee',
      month: months.find(m => m.value === payrollData.month)?.label,
      year: payrollData.year,
      dailyRate,
      daysWorked,
      basePay,
      overtimeHours,
      overtimePay,
      bonus,
      grossPay,
      taxRate,
      taxAmount,
      otherDeductions: deductions,
      totalDeductions,
      netPay
    });
  };

  const resetForm = () => {
    setSelectedEmployee('');
    setEmployeeDetails(null);
    setAttendanceData(null);
    setCalculatedPayroll(null);
    setPayrollData({
      month: new Date().getMonth() + 1,
      year: new Date().getFullYear(),
      payPeriod: `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`,
      basicSalary: 0,
      daysWorked: 0,
      overtimeHours: 0,
      overtimeRate: 1.5,
      bonus: 0,
      deductions: 0,
      taxRate: 10,
    });
  };

  const generatePDF = () => {
    if (!calculatedPayroll) {
      toast.error('Please calculate the payroll first');
      return;
    }

    try {
      // Create new jsPDF instance
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.width;

      // Add company header
      doc.setFontSize(20);
      doc.setTextColor(13, 110, 253); // #0d6efd
      doc.text('SADHNA CONSTRUCTION', pageWidth / 2, 15, { align: 'center' });
      
      doc.setFontSize(12);
      doc.setTextColor(102, 102, 102); // #666
      doc.text('Employee Payslip', pageWidth / 2, 23, { align: 'center' });
      
      // Add horizontal line
      doc.setDrawColor(224, 224, 224); // #e0e0e0
      doc.line(15, 28, pageWidth - 15, 28);
      
      // Period and Date
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      doc.text(`Pay Period: ${calculatedPayroll.month} ${calculatedPayroll.year}`, 15, 35);
      doc.text(`Date Generated: ${new Date().toLocaleDateString()}`, pageWidth - 15, 35, { align: 'right' });
      
      // Employee Info
      doc.setFontSize(11);
      doc.text('Employee Information', 15, 45);
      
      doc.setFontSize(10);
      doc.text(`Name: ${calculatedPayroll.employeeName}`, 15, 53);
      doc.text(`Designation: ${calculatedPayroll.designation}`, 15, 60);
      doc.text(`Employee ID: ${calculatedPayroll.employeeId}`, pageWidth - 15, 53, { align: 'right' });
      
      // Add second horizontal line
      doc.line(15, 65, pageWidth - 15, 65);
      
      // Earnings Table
      doc.setFontSize(11);
      doc.text('Earnings', 15, 73);
      
      // Set up earnings table
      const earningsColumns = ['Description', 'Amount (Rs)'];
      const earningsRows = [
        ['Basic Salary (Daily Rate × Days Worked)', calculatedPayroll.basePay.toFixed(2)],
        ['Overtime Pay', calculatedPayroll.overtimePay.toFixed(2)],
        ['Bonus', calculatedPayroll.bonus.toFixed(2)],
        ['Gross Pay', calculatedPayroll.grossPay.toFixed(2)]
      ];
      
      doc.autoTable({
        head: [earningsColumns],
        body: earningsRows,
        startY: 75,
        theme: 'grid',
        headStyles: { fillColor: [13, 110, 253], textColor: [255, 255, 255] },
        styles: { fontSize: 9 },
        margin: { left: 15, right: 15 }
      });
      
      // Deductions Table
      const deductionsY = doc.lastAutoTable.finalY + 10;
      doc.setFontSize(11);
      doc.text('Deductions', 15, deductionsY);
      
      // Set up deductions table
      const deductionsColumns = ['Description', 'Amount (Rs)'];
      const deductionsRows = [
        [`Tax (${calculatedPayroll.taxRate}%)`, calculatedPayroll.taxAmount.toFixed(2)],
        ['Other Deductions', calculatedPayroll.otherDeductions.toFixed(2)],
        ['Total Deductions', calculatedPayroll.totalDeductions.toFixed(2)]
      ];
      
      doc.autoTable({
        head: [deductionsColumns],
        body: deductionsRows,
        startY: deductionsY + 2,
        theme: 'grid',
        headStyles: { fillColor: [13, 110, 253], textColor: [255, 255, 255] },
        styles: { fontSize: 9 },
        margin: { left: 15, right: 15 }
      });
      
      // Net Pay
      const netPayY = doc.lastAutoTable.finalY + 10;
      doc.setFillColor(13, 110, 253);
      doc.rect(15, netPayY, pageWidth - 30, 10, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(11);
      doc.text('NET PAY', 20, netPayY + 7);
      doc.text(`Rs. ${calculatedPayroll.netPay.toFixed(2)}`, pageWidth - 20, netPayY + 7, { align: 'right' });
      
      // Footer
      const footerY = netPayY + 20;
      doc.setTextColor(102, 102, 102);
      doc.setFontSize(8);
      doc.text('This is a computer-generated document and does not require a signature.', pageWidth / 2, footerY, { align: 'center' });
      
      // Save PDF
      doc.save(`Payslip-${calculatedPayroll.employeeName}-${calculatedPayroll.month}-${calculatedPayroll.year}.pdf`);
      toast.success('Payslip generated successfully!');
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Failed to generate PDF payslip');
    }
  };

  return (
    <div className="payroll-generator">
      {/* Payroll Form */}
      <div className="payroll-form-container">
        <div className="section-title">
          <i className="fas fa-calculator"></i>
          <span>Payroll Calculator</span>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="selectedEmployee">Select Employee</label>
            <select
              id="selectedEmployee"
              value={selectedEmployee}
              onChange={handleEmployeeChange}
              disabled={loading}
            >
              <option value="">-- Select Employee --</option>
              {employees.map(emp => (
                <option key={emp._id} value={emp._id}>
                  {emp.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="payPeriod">Pay Period</label>
            <input
              type="month"
              id="payPeriod"
              name="payPeriod"
              value={payrollData.payPeriod}
              onChange={handleInputChange}
              disabled={loading}
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="basicSalary">Basic Salary (Rs)</label>
            <input
              type="number"
              id="basicSalary"
              name="basicSalary"
              value={payrollData.basicSalary}
              onChange={handleInputChange}
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="daysWorked">Days Worked</label>
            <input
              type="number"
              id="daysWorked"
              name="daysWorked"
              value={payrollData.daysWorked}
              onChange={handleInputChange}
              disabled={loading}
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="overtimeHours">Overtime Hours</label>
            <input
              type="number"
              id="overtimeHours"
              name="overtimeHours"
              value={payrollData.overtimeHours}
              onChange={handleInputChange}
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="overtimeRate">Overtime Rate (×)</label>
            <input
              type="number"
              id="overtimeRate"
              name="overtimeRate"
              step="0.1"
              min="1"
              max="3"
              value={payrollData.overtimeRate}
              onChange={handleInputChange}
              disabled={loading}
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="bonus">Bonus (Rs)</label>
            <input
              type="number"
              id="bonus"
              name="bonus"
              value={payrollData.bonus}
              onChange={handleInputChange}
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="deductions">Deductions (Rs)</label>
            <input
              type="number"
              id="deductions"
              name="deductions"
              value={payrollData.deductions}
              onChange={handleInputChange}
              disabled={loading}
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="taxRate">Tax Rate (%)</label>
            <input
              type="number"
              id="taxRate"
              name="taxRate"
              min="0"
              max="30"
              value={payrollData.taxRate}
              onChange={handleInputChange}
              disabled={loading}
            />
          </div>
        </div>

        <div className="form-actions">
          <button
            type="button"
            className="btn-secondary"
            onClick={resetForm}
            disabled={loading}
          >
            Reset
          </button>
          <button
            type="button"
            className="btn-primary"
            onClick={calculatePayroll}
            disabled={loading || !selectedEmployee}
          >
            Calculate Payroll
          </button>
        </div>
      </div>

      {/* Payroll Preview */}
      <div className="payroll-preview">
        <div className="section-title">
          <i className="fas fa-file-invoice-dollar"></i>
          <span>Payslip Preview</span>
        </div>

        {!calculatedPayroll ? (
          <div className="text-center py-5">
            <p>Fill out the form and click "Calculate Payroll" to generate a preview</p>
          </div>
        ) : (
          <>
            <div className="preview-header">
              <div className="preview-logo">
                <h4>SADHNA CONSTRUCTION</h4>
                <p>Employee Payslip</p>
              </div>
              <div className="preview-period">
                <p>Pay Period: {calculatedPayroll.month} {calculatedPayroll.year}</p>
                <p>Date Generated: {new Date().toLocaleDateString()}</p>
              </div>
            </div>

            <div className="preview-employee-info">
              <div className="info-column">
                <p><strong>Name:</strong> {calculatedPayroll.employeeName}</p>
                <p><strong>Designation:</strong> {calculatedPayroll.designation}</p>
              </div>
              <div className="info-column">
                <p><strong>Employee ID:</strong> {calculatedPayroll.employeeId}</p>
                <p><strong>Days Worked:</strong> {calculatedPayroll.daysWorked}</p>
              </div>
            </div>

            <div className="preview-section">
              <h5>Earnings</h5>
              <table className="preview-table">
                <tbody>
                  <tr>
                    <td>Basic Salary (Daily Rate × Days Worked)</td>
                    <td>Rs. {calculatedPayroll.basePay.toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td>Overtime Pay ({calculatedPayroll.overtimeHours} hours)</td>
                    <td>Rs. {calculatedPayroll.overtimePay.toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td>Bonus</td>
                    <td>Rs. {calculatedPayroll.bonus.toFixed(2)}</td>
                  </tr>
                  <tr className="total-row">
                    <td>Gross Pay</td>
                    <td>Rs. {calculatedPayroll.grossPay.toFixed(2)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="preview-section">
              <h5>Deductions</h5>
              <table className="preview-table">
                <tbody>
                  <tr>
                    <td>Tax ({calculatedPayroll.taxRate}%)</td>
                    <td>Rs. {calculatedPayroll.taxAmount.toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td>Other Deductions</td>
                    <td>Rs. {calculatedPayroll.otherDeductions.toFixed(2)}</td>
                  </tr>
                  <tr className="total-row">
                    <td>Total Deductions</td>
                    <td>Rs. {calculatedPayroll.totalDeductions.toFixed(2)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="preview-net-pay">
              <span className="net-pay-label">NET PAY</span>
              <span className="net-pay-amount">Rs. {calculatedPayroll.netPay.toFixed(2)}</span>
            </div>

            <div className="preview-actions">
              <button
                type="button"
                className="btn-primary generate-btn"
                onClick={generatePDF}
                disabled={loading}
              >
                <i className="fas fa-file-pdf"></i>
                Generate PDF
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default PayrollGenerator; 