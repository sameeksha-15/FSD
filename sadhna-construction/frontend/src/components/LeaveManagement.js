import React, { useState, useEffect } from 'react';
import API from '../services/api';
import { toast } from 'react-toastify';
import { useSocket } from '../contexts/SocketContext';
import '../pages/admin-dashboard.css';

const LeaveManagement = () => {
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const { socket, connected } = useSocket();

  useEffect(() => {
    fetchLeaveRequests();
  }, []);

  useEffect(() => {
    if (!socket) return;

    // Listen for new leave applications
    socket.on('leaveApplied', (data) => {
      console.log('📩 New leave application received:', data);
      const employeeName = data.leave?.userId?.name || data.leave?.userId?.username || 'An employee';
      toast.info(`${employeeName} submitted a new leave application`, {
        autoClose: 5000
      });
      fetchLeaveRequests(); // Refresh the list
    });

    // Listen for leave status updates
    socket.on('leaveStatusUpdated', (data) => {
      console.log('🔄 Leave status updated:', data);
      // Update the specific leave in the list without refetching
      setLeaveRequests(prev => 
        prev.map(leave => 
          leave._id === data.leave._id ? data.leave : leave
        )
      );
    });

    return () => {
      socket.off('leaveApplied');
      socket.off('leaveStatusUpdated');
    };
  }, [socket]);

  const fetchLeaveRequests = async () => {
    try {
      setLoading(true);
      console.log("Fetching leave requests for admin dashboard...");
      const response = await API.get('/api/leaves/admin');
      console.log("Leave requests data:", response.data);
      setLeaveRequests(response.data);
    } catch (error) {
      console.error("Error fetching leave requests:", error);
      toast.error("Failed to load leave requests: " + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleLeaveAction = async (leaveId, status) => {
    try {
      await API.put(`/api/leaves/${leaveId}/status`, { status });
      toast.success(`Leave request ${status.toLowerCase()}`);
      fetchLeaveRequests(); // Refresh the list
    } catch (error) {
      console.error(`Error ${status.toLowerCase()} leave request:`, error);
      toast.error(`Failed to ${status.toLowerCase()} leave request: ` + (error.response?.data?.message || error.message));
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  return (
    <div>
      <div className="action-header">
        <h2>Leave Management</h2>
        {connected && (
          <span style={{ color: '#10b981', fontSize: '0.9rem', marginLeft: '10px' }}>
            ● Real-time updates
          </span>
        )}
      </div>
      
      {loading ? (
        <div className="loading-spinner">
          <div className="spinner"></div>
        </div>
      ) : (
        <div className="table-container">
          {leaveRequests.length === 0 ? (
            <p>No leave requests found</p>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>From</th>
                  <th>To</th>
                  <th>Reason</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {leaveRequests.map((leave) => (
                  <tr key={leave._id}>
                    <td>{leave.userId?.name || leave.userId?.username || 'Unknown'}</td>
                    <td>{formatDate(leave.fromDate)}</td>
                    <td>{formatDate(leave.toDate)}</td>
                    <td>{leave.reason}</td>
                    <td>
                      <span className={`status-badge ${leave.status.toLowerCase()}`}>
                        {leave.status}
                      </span>
                    </td>
                    <td>
                      {leave.status === 'Pending' && (
                        <>
                          <button
                            className="button button-small button-green"
                            onClick={() => handleLeaveAction(leave._id, 'Approved')}
                            style={{ marginRight: '5px' }}
                          >
                            Approve
                          </button>
                          <button
                            className="button button-small button-red"
                            onClick={() => handleLeaveAction(leave._id, 'Rejected')}
                          >
                            Reject
                          </button>
                        </>
                      )}
                      {leave.status !== 'Pending' && (
                        <span>No actions available</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
};

export default LeaveManagement; 