import { useState, useEffect } from "react";
import API, { generatePayslip as generatePayslipPDF, testAuthentication } from "../services/api";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useSocket } from "../contexts/SocketContext";
import { toast } from "react-toastify";
import "./admin-dashboard.css";
import LeaveManagement from "../components/LeaveManagement";
import ApplicationsManagement from '../components/ApplicationsManagement';

export default function AdminDashboard({ view = 'overview' }) {
  const { user, logout } = useAuth();
  const { socket, connected } = useSocket();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(view);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ employeeCount: 0, attendanceRate: 0, pendingPayrolls: 0 });
  const [employees, setEmployees] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [showAddEmployeeForm, setShowAddEmployeeForm] = useState(false);
  const [newEmployee, setNewEmployee] = useState({ name: '', role: '', salary: '' });
  const [showAttendanceForm, setShowAttendanceForm] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().substr(0, 10));
  const [showPayrollForm, setShowPayrollForm] = useState(false);
  const [payrollData, setPayrollData] = useState({
    employeeId: '',
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear()
  });

  useEffect(() => {
    setActiveTab(view); // Update activeTab when view prop changes
  }, [view]);

  useEffect(() => {
    // Check if user is authenticated and is an admin
    const token = localStorage.getItem("token");
    const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
    
    console.log("Current user:", user || storedUser);
    console.log("Stored token:", token ? "exists" : "not found");
    
    if (!token) {
      console.log("No token found, redirecting to login");
      toast.error("Please log in to access the admin dashboard");
      navigate("/");
      return;
    }
    
    // Check if user role is Admin only
    const userRole = user?.role || storedUser?.role || '';
    console.log("User role:", userRole);
    
    // Only Admin role can access admin dashboard
    const allowedRoles = ['Admin', 'admin'];
    
    if (!allowedRoles.includes(userRole)) {
      console.log("User is not an admin, redirecting to employee portal");
      toast.error("You don't have permission to access the admin dashboard");
      navigate("/employee");
      return;
    }
    
    console.log(`Admin access granted for role: ${userRole}`);
    
    // Test authentication before fetching data
    const validateAuth = async () => {
      const authTest = await testAuthentication();
      console.log("Authentication test result:", authTest);
      
      if (!authTest.success) {
        console.error("Authentication test failed:", authTest.error);
        toast.error("Authentication error: " + (authTest.error?.message || "Unknown error"));
        logout();
        navigate("/");
        return;
      }
      
      console.log("Authentication test passed, fetching data...");
      fetchData();
    };
    
    validateAuth();
  }, [navigate, user, logout]);

  // WebSocket listener for real-time attendance updates
  useEffect(() => {
    if (!socket) return;

    socket.on('attendanceAdded', (data) => {
      console.log('📍 New attendance record received:', data);
      toast.info(`New attendance: ${data.attendance.employeeId?.name || 'Employee'} - ${data.attendance.status}`);
      
      // Add the new attendance to the list
      setAttendance(prev => [data.attendance, ...prev]);
      
      // Recalculate stats
      setStats(prevStats => {
        const newTotalAttendance = attendance.length + 1;
        const newPresentCount = [...attendance, data.attendance].filter(a => a.status === 'Present').length;
        const newAttendanceRate = Math.round((newPresentCount / newTotalAttendance) * 100);
        
        return {
          ...prevStats,
          attendanceRate: newAttendanceRate
        };
      });
    });

    return () => {
      socket.off('attendanceAdded');
    };
  }, [socket, attendance]);

  const fetchData = async () => {
    try {
      setLoading(true);
      console.log("Fetching admin dashboard data...");
      
      // Get auth token for debugging
      const token = localStorage.getItem("token");
      console.log("Using auth token:", token ? "Token exists" : "No token found");
      
      // Fetch employees
      console.log("Fetching employees from /api/employees...");
      const employeesRes = await API.get('/api/employees');
      console.log("Employees data:", employeesRes.data);
      setEmployees(employeesRes.data);
      
      // Fetch attendance
      console.log("Fetching attendance from /api/attendance...");
      const attendanceRes = await API.get('/api/attendance');
      console.log("Attendance data:", attendanceRes.data);
      setAttendance(attendanceRes.data);
      
      // Calculate attendance rate
      let attendanceRate = 0;
      if (attendanceRes.data.length > 0) {
        const presentCount = attendanceRes.data.filter(a => a.status === 'Present').length;
        attendanceRate = Math.round((presentCount / attendanceRes.data.length) * 100);
      }
      
      // For demo purposes, calculate pending payrolls as 1/3 of employees
      const pendingPayrolls = Math.round(employeesRes.data.length / 3);
      
      setStats({
        employeeCount: employeesRes.data.length,
        attendanceRate,
        pendingPayrolls
      });
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
      console.error("Error details:", err.response?.data || "No error data available");
      console.error("Error status:", err.response?.status || "No status available");
      
      // Set empty default data to prevent UI errors
      setEmployees([]);
      setAttendance([]);
      setStats({
        employeeCount: 0,
        attendanceRate: 0,
        pendingPayrolls: 0
      });
      
      toast.error("Error loading dashboard data: " + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleAddEmployee = async (e) => {
    e.preventDefault();
    try {
      await API.post('/api/employees', newEmployee);
      toast.success('Employee added successfully');
      setNewEmployee({ name: '', role: '', salary: '' });
      setShowAddEmployeeForm(false);
      fetchData(); // Refresh data
    } catch (err) {
      console.error('Error adding employee:', err);
      toast.error('Failed to add employee: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleAttendanceSubmit = async (e, employeeId, status) => {
    e.preventDefault();
    try {
      await API.post('/api/attendance', {
        employeeId,
        date: selectedDate,
        status
      });
      toast.success(`Marked ${status} for employee`);
      fetchData(); // Refresh data
    } catch (err) {
      console.error('Error marking attendance:', err);
      toast.error('Failed to mark attendance: ' + (err.response?.data?.message || err.message));
    }
  };

  const generatePayslip = async (e) => {
    e.preventDefault();
    
    if (!payrollData.employeeId) {
      toast.error("Please select an employee");
      return;
    }
    
    try {
      await generatePayslipPDF(payrollData.employeeId, payrollData.month, payrollData.year);
      toast.success('Generating payslip...');
    } catch (err) {
      console.error('Error generating payslip:', err);
      toast.error('Failed to generate payslip: ' + (err.response?.data?.message || err.message));
    }
  };
  
  // Helper function to format date
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const handleLogout = () => {
    // Clear all stored data
    localStorage.removeItem('username');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    logout();
    navigate('/');
    toast.success('Logged out successfully');
  };

  return (
    <div className="admin-container">
      <header className="admin-header">
        <div className="admin-header-content">
          <div>
            <h1>Admin Dashboard</h1>
            <p>Welcome, {user?.name || user?.username || 'admin'}</p>
          </div>
          <button onClick={handleLogout} className="button button-red">
            Logout
          </button>
        </div>
      </header>
      
      <main className="admin-main">
        <div className="dashboard-tabs">
          <button
            className={activeTab === 'overview' ? 'active' : ''}
            onClick={() => setActiveTab('overview')}
          >
            Overview
          </button>
          <button
            className={activeTab === 'employees' ? 'active' : ''}
            onClick={() => setActiveTab('employees')}
          >
            Employees
          </button>
          <button
            className={activeTab === 'attendance' ? 'active' : ''}
            onClick={() => setActiveTab('attendance')}
          >
            Attendance
          </button>
          <button
            className={activeTab === 'payroll' ? 'active' : ''}
            onClick={() => setActiveTab('payroll')}
          >
            Payroll
          </button>
          <button
            className={activeTab === 'leaves' ? 'active' : ''}
            onClick={() => setActiveTab('leaves')}
          >
            Leaves
          </button>
          <button
            className={activeTab === 'applications' ? 'active' : ''}
            onClick={() => setActiveTab('applications')}
          >
            Applications
          </button>
        </div>

        {loading ? (
          <div className="loading-spinner">
            <div className="spinner"></div>
          </div>
        ) : (
          <>
            {activeTab === 'overview' && (
              <div className="stats-grid">
                <div className="stats-card">
                  <div className="stats-card-content">
                    <div className="stats-icon icon-employees">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M16 7C16 9.21 14.21 11 12 11C9.79 11 8 9.21 8 7C8 4.79 9.79 3 12 3C14.21 3 16 4.79 16 7Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M12 14C8.13 14 5 17.13 5 21H19C19 17.13 15.87 14 12 14Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                    <div className="stats-text">
                      <h2 className="stats-label">Total Employees</h2>
                      <p className="stats-value">{stats.employeeCount}</p>
                    </div>
                  </div>
                </div>
                
                <div className="stats-card">
                  <div className="stats-card-content">
                    <div className="stats-icon icon-attendance">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M8 7V3M16 7V3M5 11H19M5 21H19C20.1046 21 21 20.1046 21 19V7C21 5.89543 20.1046 5 19 5H5C3.89543 5 3 5.89543 3 7V19C3 20.1046 3.89543 21 5 21Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                    <div className="stats-text">
                      <h2 className="stats-label">Attendance Rate</h2>
                      <p className="stats-value">{stats.attendanceRate}%</p>
                    </div>
                  </div>
                </div>
                
                <div className="stats-card">
                  <div className="stats-card-content">
                    <div className="stats-icon icon-payroll">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 1V23" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M17 5H9.5C8.57174 5 7.6815 5.36875 7.02513 6.02513C6.36875 6.6815 6 7.57174 6 8.5C6 9.42826 6.36875 10.3185 7.02513 10.9749C7.6815 11.6313 8.57174 12 9.5 12H14.5C15.4283 12 16.3185 12.3687 16.9749 13.0251C17.6313 13.6815 18 14.5717 18 15.5C18 16.4283 17.6313 17.3185 16.9749 17.9749C16.3185 18.6313 15.4283 19 14.5 19H6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                    <div className="stats-text">
                      <h2 className="stats-label">Pending Payrolls</h2>
                      <p className="stats-value">{stats.pendingPayrolls}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {activeTab === 'employees' && (
              <div className="action-cards">
                <div className="action-card">
                  <div className="action-header">
                    <h2>Employee Management</h2>
                    <button className="button" onClick={() => setShowAddEmployeeForm(!showAddEmployeeForm)}>
                      {showAddEmployeeForm ? 'Cancel' : 'Add Employee'}
                    </button>
                  </div>
                  
                  {showAddEmployeeForm && (
                    <form onSubmit={handleAddEmployee} className="admin-form">
                      <div className="form-group">
                        <label className="form-label">Name</label>
                        <input 
                          type="text" 
                          value={newEmployee.name} 
                          onChange={(e) => setNewEmployee({...newEmployee, name: e.target.value})}
                          className="form-input"
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Role</label>
                        <input 
                          type="text" 
                          value={newEmployee.role} 
                          onChange={(e) => setNewEmployee({...newEmployee, role: e.target.value})}
                          className="form-input"
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Salary</label>
                        <input 
                          type="number" 
                          value={newEmployee.salary} 
                          onChange={(e) => setNewEmployee({...newEmployee, salary: e.target.value})}
                          className="form-input"
                          required
                        />
                      </div>
                      <button type="submit" className="button">Save Employee</button>
                    </form>
                  )}
                  
                  <div className="table-container">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Role</th>
                          <th>Salary</th>
                        </tr>
                      </thead>
                      <tbody>
                        {employees.length === 0 ? (
                          <tr>
                            <td colSpan="3" style={{ textAlign: 'center' }}>No employees found</td>
                          </tr>
                        ) : (
                          employees.slice(0, 5).map(emp => (
                            <tr key={emp._id}>
                              <td>{emp.name}</td>
                              <td>{emp.role}</td>
                              <td>Rs.{emp.salary}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
            
            {activeTab === 'attendance' && (
              <div className="action-cards">
                <div className="action-card">
                  <div className="action-header">
                    <h2>Attendance Management</h2>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                      {connected && (
                        <span style={{ color: '#10b981', fontSize: '0.9rem' }}>
                          ● Real-time updates
                        </span>
                      )}
                      <button className="button" onClick={() => setShowAttendanceForm(!showAttendanceForm)}>
                        {showAttendanceForm ? 'Cancel' : 'Mark Attendance'}
                      </button>
                    </div>
                  </div>
                  
                  {showAttendanceForm && (
                    <div className="admin-form">
                      <div className="form-group">
                        <label className="form-label">Date</label>
                        <input 
                          type="date" 
                          value={selectedDate} 
                          onChange={(e) => setSelectedDate(e.target.value)}
                          className="form-input"
                        />
                      </div>
                      
                      <div className="table-container">
                        <table className="table">
                          <thead>
                            <tr>
                              <th>Employee</th>
                              <th>Action</th>
                            </tr>
                          </thead>
                          <tbody>
                            {employees.map(emp => (
                              <tr key={emp._id}>
                                <td>{emp.name}</td>
                                <td>
                                  <button 
                                    className="button button-green" 
                                    onClick={(e) => handleAttendanceSubmit(e, emp._id, 'Present')}
                                    style={{ marginRight: '5px' }}
                                  >
                                    Present
                                  </button>
                                  <button 
                                    className="button button-red" 
                                    onClick={(e) => handleAttendanceSubmit(e, emp._id, 'Absent')}
                                  >
                                    Absent
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                  
                  <div className="table-container">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Employee</th>
                          <th>Date</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {attendance.length === 0 ? (
                          <tr>
                            <td colSpan="3" style={{ textAlign: 'center' }}>No attendance records found</td>
                          </tr>
                        ) : (
                          attendance.slice(0, 5).map(record => (
                            <tr key={record._id}>
                              <td>{record.employeeId?.name || 'Unknown'}</td>
                              <td>{formatDate(record.date)}</td>
                              <td>
                                <span className={`status-badge ${record.status.toLowerCase()}`}>
                                  {record.status}
                                </span>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
            
            {activeTab === 'payroll' && (
              <div className="action-cards">
                <div className="action-card">
                  <div className="action-header">
                    <h2>Payroll Management</h2>
                    <button className="button" onClick={() => setShowPayrollForm(!showPayrollForm)}>
                      {showPayrollForm ? 'Cancel' : 'Generate Payslip'}
                    </button>
                  </div>
                  
                  {showPayrollForm && (
                    <form onSubmit={generatePayslip} className="admin-form">
                      <div className="form-group">
                        <label className="form-label">Employee</label>
                        <select 
                          value={payrollData.employeeId} 
                          onChange={(e) => setPayrollData({...payrollData, employeeId: e.target.value})}
                          className="form-input"
                          required
                        >
                          <option value="">Select Employee</option>
                          {employees.map(emp => (
                            <option key={emp._id} value={emp._id}>{emp.name}</option>
                          ))}
                        </select>
                      </div>
                      <div className="form-group">
                        <label className="form-label">Month</label>
                        <select 
                          value={payrollData.month} 
                          onChange={(e) => setPayrollData({...payrollData, month: e.target.value})}
                          className="form-input"
                          required
                        >
                          {Array.from({ length: 12 }, (_, i) => (
                            <option key={i + 1} value={i + 1}>
                              {new Date(0, i).toLocaleString('default', { month: 'long' })}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="form-group">
                        <label className="form-label">Year</label>
                        <select 
                          value={payrollData.year} 
                          onChange={(e) => setPayrollData({...payrollData, year: e.target.value})}
                          className="form-input"
                          required
                        >
                          {Array.from({ length: 5 }, (_, i) => {
                            const year = new Date().getFullYear() - 2 + i;
                            return (
                              <option key={year} value={year}>{year}</option>
                            );
                          })}
                        </select>
                      </div>
                      <button type="submit" className="button">Generate Payslip</button>
                    </form>
                  )}
                  
                  <div className="table-container">
                    <p style={{ marginBottom: '10px' }}>Recent Payroll Activity</p>
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Employee</th>
                          <th>Period</th>
                          <th>Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {employees.length === 0 ? (
                          <tr>
                            <td colSpan="3" style={{ textAlign: 'center' }}>No payroll records found</td>
                          </tr>
                        ) : (
                          employees.slice(0, 3).map(emp => (
                            <tr key={emp._id}>
                              <td>{emp.name}</td>
                              <td>{new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}</td>
                              <td>Rs.{emp.salary}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
            
            {activeTab === 'leaves' && (
              <div className="dashboard-content">
                <LeaveManagement />
              </div>
            )}

            {activeTab === 'applications' && (
              <div className="dashboard-content">
                <ApplicationsManagement />
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
} 