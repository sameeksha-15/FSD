import React, { useState, useEffect } from 'react';
import API from '../services/api';
import { toast } from 'react-toastify';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';

function LeaveApplication({ onLeaveApplied }) {
  const [reason, setReason] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [myLeaves, setMyLeaves] = useState([]);
  const { user } = useAuth();
  const { socket, connected } = useSocket();

  // Fetch user's leave requests when component mounts
  useEffect(() => {
    fetchMyLeaves();
  }, []);

  // Listen for real-time leave status updates
  useEffect(() => {
    if (!socket || !user) return;

    socket.on('leaveStatusUpdated', (data) => {
      console.log('🔔 Leave status updated:', data);
      
      // Check if this update is for the current user's leave
      if (data.leave && data.leave.userId && 
          (data.leave.userId._id === user._id || data.leave.userId._id === user.id)) {
        
        // Show different toast based on status
        const status = data.status.toLowerCase();
        if (status === 'approved') {
          toast.success(`✅ Your leave request has been approved!`, {
            autoClose: 5000
          });
        } else if (status === 'rejected') {
          toast.error(`❌ Your leave request has been rejected`, {
            autoClose: 5000
          });
        } else {
          toast.info(`Your leave request status: ${status}`, {
            autoClose: 5000
          });
        }
        
        // Update the leave in the list
        setMyLeaves(prev => 
          prev.map(leave => 
            leave._id === data.leave._id ? data.leave : leave
          )
        );
      }
    });

    return () => {
      socket.off('leaveStatusUpdated');
    };
  }, [socket, user]);

  const fetchMyLeaves = async () => {
    setLoading(true);
    try {
      console.log("Fetching user leave requests...");
      const res = await API.get('/api/leaves/my-leaves');
      console.log("Received leave data:", res.data);
      setMyLeaves(res.data);
    } catch (err) {
      console.error("Error fetching leave requests:", err);
      toast.error("Failed to load your leave requests: " + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate dates
    if (new Date(startDate) > new Date(endDate)) {
      toast.error("End date cannot be before start date");
      return;
    }

    setLoading(true);
    
    try {
      // Get the user ID from auth context
      let userId = null;
      
      if (user) {
        userId = user._id || user.id;
        console.log("Using user ID from context:", userId);
      } 
      
      // If not in context, try localStorage
      if (!userId) {
        const userData = localStorage.getItem('user');
        if (userData) {
          try {
            const parsedUser = JSON.parse(userData);
            userId = parsedUser._id || parsedUser.id;
            console.log("Using user ID from localStorage:", userId);
          } catch (e) {
            console.error("Error parsing user data:", e);
          }
        }
      }
      
      if (!userId) {
        toast.error("Could not identify user. Please log in again.");
        setLoading(false);
        return;
      }
      
      console.log("Submitting leave request with data:", {
        reason,
        fromDate: startDate,
        toDate: endDate,
        userId
      });
      
      const res = await API.post('/api/leaves/apply', { 
        reason, 
        fromDate: startDate, 
        toDate: endDate,
        userId: userId
      });
      
      console.log("Leave request response:", res.data);
      toast.success("Leave request submitted successfully");
      
      // Clear form fields
      setReason('');
      setStartDate('');
      setEndDate('');
      
      // Refresh leave requests
      fetchMyLeaves();
      
      // Call callback if provided
      if (onLeaveApplied) onLeaveApplied();
    } catch (err) {
      console.error("Error submitting leave request:", err);
      toast.error(err.response?.data?.message || "Failed to submit leave request");
    } finally {
      setLoading(false);
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  return (
    <div className="leave-content">
      <div className="leave-form-container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3>Apply for Leave</h3>
          {connected && (
            <span style={{ color: '#10b981', fontSize: '0.85rem' }}>
              ● Real-time updates
            </span>
          )}
        </div>
        <form onSubmit={handleSubmit} className="leave-form">
          <div className="form-group">
            <label className="form-label">From Date:</label>
            <input 
              type="date" 
              value={startDate} 
              onChange={(e) => setStartDate(e.target.value)} 
              required 
              className="form-input"
              min={new Date().toISOString().split('T')[0]}
            />
          </div>
          <div className="form-group">
            <label className="form-label">To Date:</label>
            <input 
              type="date" 
              value={endDate} 
              onChange={(e) => setEndDate(e.target.value)} 
              required 
              className="form-input"
              min={startDate || new Date().toISOString().split('T')[0]}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Reason:</label>
            <textarea 
              value={reason} 
              onChange={(e) => setReason(e.target.value)} 
              required 
              className="form-input form-textarea"
              placeholder="Please explain the reason for your leave request"
            />
          </div>
          <button 
            type="submit"
            className="form-button"
            disabled={loading}
          >
            {loading ? 'Submitting...' : 'Submit Leave Request'}
          </button>
        </form>
      </div>
      
      <div className="my-leaves-container">
        <h3 className="subsection-title">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M16 2V6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M8 2V6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M3 10H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M9 16L11 18L15 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          My Leave Requests
        </h3>
        {loading ? (
          <div className="loading-spinner small">
            <div className="spinner"></div>
          </div>
        ) : myLeaves.length === 0 ? (
          <p className="no-data-message">You have no leave requests.</p>
        ) : (
          <div className="leave-table-container">
            <table className="leave-table">
              <thead>
                <tr>
                  <th>From</th>
                  <th>To</th>
                  <th>Reason</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {myLeaves.map(leave => (
                  <tr key={leave._id}>
                    <td>{formatDate(leave.fromDate)}</td>
                    <td>{formatDate(leave.toDate)}</td>
                    <td>{leave.reason}</td>
                    <td>
                      <span className={`status-badge ${leave.status.toLowerCase()}`}>
                        {leave.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default LeaveApplication; 