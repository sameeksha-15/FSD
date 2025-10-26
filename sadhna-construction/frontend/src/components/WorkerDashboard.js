import React, { useEffect, useState } from 'react';
import API, { fetchMyPayInfo, fetchMyAttendance, fetchEmployeeProfile } from '../services/api';
import { toast } from 'react-toastify';
import { useAuth } from '../contexts/AuthContext';

// We don't need to import LeaveApplication here anymore as we're handling it in the EmployeePortal

function WorkerDashboard({ userId }) {
  const [payInfo, setPayInfo] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [employeeProfile, setEmployeeProfile] = useState(null);
  const [loadingPay, setLoadingPay] = useState(true);
  const [loadingAttendance, setLoadingAttendance] = useState(true);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const { user } = useAuth();
  
  // Get the effective user ID (from props or context)
  const effectiveUserId = userId || user?._id || user?.id;
  const workerName = localStorage.getItem('username') || user?.name || user?.username;

  useEffect(() => {
    if (!effectiveUserId) {
      console.error("No user ID available for fetching worker data");
      toast.error("Could not identify user");
      setLoadingPay(false);
      setLoadingAttendance(false);
      setLoadingProfile(false);
      return;
    }

    console.log("Fetching worker data for user ID:", effectiveUserId);

    // Fetch employee profile data
    const fetchEmployeeProfileData = async () => {
      try {
        const res = await fetchEmployeeProfile();
        console.log("Employee profile received:", res.data);
        setEmployeeProfile(res.data);
        
        // If the profile includes pay info, use it
        if (res.data.pay) {
          setPayInfo({
            employeeName: res.data.name,
            month: new Date().getMonth() + 1,
            year: new Date().getFullYear(),
            presentDays: res.data.attendance.present,
            dailyRate: res.data.pay.dailyRate,
            totalSalary: res.data.pay.totalSalary,
            // Store the base salary here too
            baseSalary: res.data.salary
          });
          setLoadingPay(false);
        }
        
        // If it includes attendance, use that too
        if (res.data.recentAttendance && res.data.recentAttendance.length > 0) {
          setAttendance(res.data.recentAttendance);
          setLoadingAttendance(false);
        }
      } catch (err) {
        console.error("Error fetching employee profile:", err);
        toast.error("Failed to load your profile: " + (err.response?.data?.message || err.message));
      } finally {
        setLoadingProfile(false);
      }
    };

    // Fetch pay info (as fallback)
    const fetchPayInfoData = async () => {
      try {
        const res = await fetchMyPayInfo();
        console.log("Pay info received:", res.data);
        
        // First, try to get the base salary from the employee profile
        let baseSalary = employeeProfile?.salary;
        
        // If we don't have a base salary yet, try to fetch it
        if (!baseSalary && effectiveUserId) {
          try {
            const profileRes = await API.get(`/api/employees/${effectiveUserId}`);
            baseSalary = profileRes.data.salary;
          } catch (err) {
            console.error("Error fetching employee data for salary:", err);
          }
        }
        
        setPayInfo({
          ...res.data,
          baseSalary: baseSalary || 0
        });
      } catch (err) {
        console.error("Error fetching pay info:", err);
        toast.error("Failed to load payment information: " + (err.response?.data?.message || err.message));
      } finally {
        setLoadingPay(false);
      }
    };

    // Fetch attendance records (as fallback)
    const fetchAttendanceData = async () => {
      try {
        const res = await fetchMyAttendance();
        console.log("Attendance data received:", res.data);
        setAttendance(res.data);
      } catch (err) {
        console.error("Error fetching attendance:", err);
        toast.error("Failed to load attendance records: " + (err.response?.data?.message || err.message));
      } finally {
        setLoadingAttendance(false);
      }
    };

    // First try to get all data from profile
    fetchEmployeeProfileData().then(() => {
      // If profile doesn't include pay info or attendance, fetch them separately
      if (loadingPay) fetchPayInfoData();
      if (loadingAttendance) fetchAttendanceData();
    });
  }, [effectiveUserId, user]);

  // Format date for display
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  return (
    <div className="dashboard-content">
      <div className="pay-info-section">
        <h3 className="subsection-title">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 1V23" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M17 5H9.5C8.57174 5 7.6815 5.36875 7.02513 6.02513C6.36875 6.6815 6 7.57174 6 8.5C6 9.42826 6.36875 10.3185 7.02513 10.9749C7.6815 11.6313 8.57174 12 9.5 12H14.5C15.4283 12 16.3185 12.3687 16.9749 13.0251C17.6313 13.6815 18 14.5717 18 15.5C18 16.4283 17.6313 17.3185 16.9749 17.9749C16.3185 18.6313 15.4283 19 14.5 19H6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          My Pay (Current Month)
        </h3>
        {loadingPay && loadingProfile ? (
          <div className="loading-spinner small">
            <div className="spinner"></div>
          </div>
        ) : payInfo ? (
          <div className="pay-info-grid">
            <div className="pay-info-item">
              <span className="info-label">Employee:</span>
              <span className="info-value">{payInfo.employeeName || employeeProfile?.name || workerName}</span>
            </div>
            <div className="pay-info-item">
              <span className="info-label">Month/Year:</span>
              <span className="info-value">{payInfo.month}/{payInfo.year}</span>
            </div>
            <div className="pay-info-item">
              <span className="info-label">Base Salary:</span>
              <span className="info-value">Rs.{payInfo.baseSalary || employeeProfile?.salary || '0'}</span>
            </div>
            <div className="pay-info-item">
              <span className="info-label">Days Present:</span>
              <span className="info-value">{payInfo.presentDays}</span>
            </div>
            <div className="pay-info-item">
              <span className="info-label">Daily Rate:</span>
              <span className="info-value">Rs.{payInfo.dailyRate}</span>
            </div>
            <div className="pay-info-item total">
              <span className="info-label">Total Salary:</span>
              <span className="info-value">Rs.{payInfo.totalSalary}</span>
            </div>
          </div>
        ) : employeeProfile ? (
          <div className="pay-info-grid">
            <div className="pay-info-item">
              <span className="info-label">Employee:</span>
              <span className="info-value">{employeeProfile.name || workerName}</span>
            </div>
            <div className="pay-info-item">
              <span className="info-label">Role:</span>
              <span className="info-value">{employeeProfile.role}</span>
            </div>
            <div className="pay-info-item">
              <span className="info-label">Base Salary:</span>
              <span className="info-value">Rs.{employeeProfile.salary}</span>
            </div>
            <div className="pay-info-item total">
              <span className="info-label">Days Present:</span>
              <span className="info-value">{employeeProfile.attendance?.present || 0}</span>
            </div>
          </div>
        ) : (
          <p className="no-data-message">Pay information is not available</p>
        )}
      </div>
      
      <div className="attendance-section">
        <h3 className="subsection-title">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M16 2V6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M8 2V6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M3 10H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          My Attendance
        </h3>
        {loadingAttendance && loadingProfile ? (
          <div className="loading-spinner small">
            <div className="spinner"></div>
          </div>
        ) : attendance.length ? (
          <div className="attendance-table-container">
            <table className="attendance-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {attendance.map((att) => (
                  <tr key={att._id}>
                    <td>{formatDate(att.date)}</td>
                    <td>
                      <span className={`status-badge ${att.status.toLowerCase()}`}>
                        {att.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="no-data-message">No attendance records found.</p>
        )}
      </div>
    </div>
  );
}

export default WorkerDashboard; 