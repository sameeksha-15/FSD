import React, { useEffect, useState } from 'react';
import axios from 'axios';

function LeaveList() {
  const [requests, setRequests] = useState([]);

  const fetchRequests = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await axios.get('http://localhost:5000/api/leaves', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRequests(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const updateStatus = async (id, status) => {
    const token = localStorage.getItem('token');
    try {
      await axios.patch(
        `http://localhost:5000/api/leaves/${id}`,
        { status },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchRequests();
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  return (
    <div>
      <h3>Leave Requests</h3>
      {requests.length === 0 ? (
        <p>No leave requests</p>
      ) : (
        <ul>
          {requests.map(req => (
            <li key={req._id}>
              {req.userId.username} requested leave on {new Date(req.date).toLocaleDateString()} for "{req.reason}" - Status: {req.status}
              {req.status === 'Pending' && (
                <>
                  <button onClick={() => updateStatus(req._id, 'Approved')}>Approve</button>
                  <button onClick={() => updateStatus(req._id, 'Rejected')}>Reject</button>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default LeaveList; 