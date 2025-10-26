import React, { useState, useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useSocket } from "../contexts/SocketContext";
import API, { fetchUserProfile, fetchEmployeeProfile } from '../services/api';
import { toast } from "react-toastify";
import './employee-portal.css';

// Import existing worker dashboard component
import WorkerDashboard from '../components/WorkerDashboard';
import LeaveApplication from '../components/LeaveApplication';
import SiteMonitoring from '../components/SiteMonitoring';

export default function EmployeePortal() {
  const { user, login, logout } = useAuth();
  const { socket, connected } = useSocket();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [employeeData, setEmployeeData] = useState(null);
  const [attendanceUpdateKey, setAttendanceUpdateKey] = useState(0);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error("Authentication required");
      navigate('/');
      return;
    }

    const fetchEmployeeData = async () => {
      try {
        setLoading(true);
        
        // First ensure we have the user data
        let userData = user;
        
        if (!userData || !userData._id) {
          console.log("No user in context, fetching profile...");
          try {
            // Try to get user profile from API
            const userRes = await fetchUserProfile();
            userData = userRes.data;
            
            // Update context with fresh user data
            if (userData) {
              login({
                ...userData,
                id: userData._id, // For compatibility
                name: userData.username // For display
              });
            }
          } catch (userErr) {
            console.error("Failed to get user profile:", userErr);
            // No toast here, we'll show it after employee data fetch fails
          }
        }
        
        // Try to fetch employee profile data
        try {
          console.log("Fetching employee profile data...");
          const res = await fetchEmployeeProfile();
          console.log("Fetched employee profile data:", res.data);
          
          setEmployeeData(res.data);
          
          // Store some critical data in localStorage for persistence
          localStorage.setItem('username', userData?.username || userData?.name || res.data.name);
        } catch (profileErr) {
          console.error("Error fetching employee profile:", profileErr);
          
          // Fallback to old method if profile endpoint fails
          if (userData && (userData._id || userData.id)) {
            const userId = userData._id || userData.id;
            console.log("Fetching employee data for user ID:", userId);
            
            try {
              const res = await API.get(`/api/employees/${userId}`);
              console.log("Fetched employee data:", res.data);
              
              setEmployeeData(res.data);
              
              // Store some critical data in localStorage for persistence
              localStorage.setItem('username', userData.username || userData.name || res.data.name);
            } catch (empErr) {
              console.error("Error fetching employee data:", empErr);
              toast.error("Could not load your employee information");
            }
          } else {
            console.error("Could not determine user ID for employee data fetch");
            toast.error("Failed to retrieve your profile");
          }
        }
      } catch (err) {
        console.error("Error in fetchEmployeeData:", err);
        toast.error("Error loading employee data");
      } finally {
        setLoading(false);
      }
    };
    
    fetchEmployeeData();
  }, [user, login, navigate]);

  // WebSocket listeners for real-time updates
  useEffect(() => {
    if (!socket || !user) return;

    // Listen for attendance updates
    socket.on('attendanceAdded', (data) => {
      console.log('📍 Attendance update received:', data);
      
      // Check if this attendance is for current user
      if (data.attendance && employeeData && 
          data.attendance.employeeId?._id === employeeData._id) {
        toast.success(`Your attendance has been marked: ${data.attendance.status}`);
        // Force refresh of WorkerDashboard by updating key
        setAttendanceUpdateKey(prev => prev + 1);
      }
    });

    // Listen for leave status updates (already in LeaveApplication, but adding here for consistency)
    socket.on('leaveStatusUpdated', (data) => {
      console.log('🔔 Leave status update received in portal:', data);
      
      if (data.leave && data.leave.userId && 
          (data.leave.userId._id === user._id || data.leave.userId._id === user.id)) {
        toast.info(`Your leave request has been ${data.status.toLowerCase()}`, {
          autoClose: 5000
        });
      }
    });

    // Listen for new leave applications (if user is supervisor/manager)
    if (user.role === 'Supervisor' || user.role === 'Manager') {
      socket.on('leaveApplied', (data) => {
        console.log('📩 New leave application notification:', data);
        toast.info('New leave application submitted');
      });
    }

    return () => {
      socket.off('attendanceAdded');
      socket.off('leaveStatusUpdated');
      socket.off('leaveApplied');
    };
  }, [socket, user, employeeData]);

  const handleLogout = () => {
    // Clear any stored data
    localStorage.removeItem('username');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    logout();
    navigate('/');
    toast.success("Logged out successfully");
  };

  return (
    <div className="employee-container">
      <header className="employee-header">
        <div className="employee-header-content">
          <div>
            <h1>Employee Portal</h1>
            <p>Welcome, {user?.name || user?.username || employeeData?.name || 'Employee'}</p>
          </div>
          <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
            {connected && (
              <span style={{ color: '#10b981', fontSize: '0.9rem', fontWeight: '500' }}>
                ● Live
              </span>
            )}
            <button 
              onClick={handleLogout}
              className="logout-button"
            >
              Logout
            </button>
          </div>
        </div>
      </header>
      
      <main className="employee-main">
        {loading ? (
          <div className="loading-spinner">
            <div className="spinner"></div>
          </div>
        ) : (
          <div className="stats-grid">
            <div className="stats-card">
              <div className="stats-card-content">
                <div className="stats-icon icon-employee-id">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M16 7C16 9.21 14.21 11 12 11C9.79 11 8 9.21 8 7C8 4.79 9.79 3 12 3C14.21 3 16 4.79 16 7Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M12 14C8.13 14 5 17.13 5 21H19C19 17.13 15.87 14 12 14Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div className="stats-text">
                  <h2 className="stats-label">Employee ID</h2>
                  <p className="stats-value">{employeeData?._id || user?._id || user?.id || 'N/A'}</p>
                </div>
              </div>
            </div>
            
            <div className="stats-card">
              <div className="stats-card-content">
                <div className="stats-icon icon-role">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M9 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M16 17L21 12L16 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M21 12H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div className="stats-text">
                  <h2 className="stats-label">Role</h2>
                  <p className="stats-value">{employeeData?.role || user?.role || 'Worker'}</p>
                </div>
              </div>
            </div>
            
            <div className="stats-card">
              <div className="stats-card-content">
                <div className="stats-icon icon-salary">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 1V23" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M17 5H9.5C8.57174 5 7.6815 5.36875 7.02513 6.02513C6.36875 6.6815 6 7.57174 6 8.5C6 9.42826 6.36875 10.3185 7.02513 10.9749C7.6815 11.6313 8.57174 12 9.5 12H14.5C15.4283 12 16.3185 12.3687 16.9749 13.0251C17.6313 13.6815 18 14.5717 18 15.5C18 16.4283 17.6313 17.3185 16.9749 17.9749C16.3185 18.6313 15.4283 19 14.5 19H6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div className="stats-text">
                  <h2 className="stats-label">Salary</h2>
                  <p className="stats-value">Rs.{employeeData?.salary || '0'}</p>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div className="sections">
          {/* Site Monitoring - Only for Supervisor and Manager */}
          {(user?.role === 'Supervisor' || user?.role === 'Manager') && (
            <section className="monitoring-section">
              <SiteMonitoring />
            </section>
          )}

          {/* Worker Dashboard */}
          <section className="dashboard-section">
            <h2 className="section-header">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 19V13C9 11.8954 8.10457 11 7 11H5C3.89543 11 3 11.8954 3 13V19C3 20.1046 3.89543 21 5 21H7C8.10457 21 9 20.1046 9 19Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M15 8V19C15 20.1046 15.8954 21 17 21H19C20.1046 21 21 20.1046 21 19V8C21 6.89543 20.1046 6 19 6H17C15.8954 6 15 6.89543 15 8Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M9 7V5C9 3.89543 8.10457 3 7 3H5C3.89543 3 3 3.89543 3 5V7C3 8.10457 3.89543 9 5 9H7C8.10457 9 9 8.10457 9 7Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M15 4V3C15 1.89543 15.8954 1 17 1H19C20.1046 1 21 1.89543 21 3V4C21 5.10457 20.1046 6 19 6H17C15.8954 6 15 5.10457 15 4Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              My Dashboard
            </h2>
            <WorkerDashboard key={attendanceUpdateKey} userId={user?._id || user?.id} />
          </section>

          {/* Leave Application */}
          <section className="leave-section">
            <h2 className="section-header leave">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M17 21V19C17 17.9391 16.5786 16.9217 15.8284 16.1716C15.0783 15.4214 14.0609 15 13 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M9 11C11.2091 11 13 9.20914 13 7C13 4.79086 11.2091 3 9 3C6.79086 3 5 4.79086 5 7C5 9.20914 6.79086 11 9 11Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M23 21V19C22.9993 18.1137 22.7044 17.2528 22.1614 16.5523C21.6184 15.8519 20.8581 15.3516 20 15.13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M16 3.13C16.8604 3.35031 17.623 3.85071 18.1676 4.55232C18.7122 5.25392 19.0078 6.11683 19.0078 7.005C19.0078 7.89317 18.7122 8.75608 18.1676 9.45768C17.623 10.1593 16.8604 10.6597 16 10.88" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Apply for Leave
            </h2>
            <LeaveApplication onLeaveApplied={() => toast.success("Leave request submitted successfully")} />
          </section>
        </div>
      </main>
    </div>
  );
} 