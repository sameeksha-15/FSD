import React, { useState } from 'react';
import axios from 'axios';

function LeaveRequest({ onRequestSubmitted }) {
  const [date, setDate] = useState('');
  const [reason, setReason] = useState('');

  const handleSubmit = async e => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    try {
      await axios.post(
        'http://localhost:5000/api/leaves',
        { date, reason },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setDate('');
      setReason('');
      onRequestSubmitted();
    } catch (err) {
      console.error(err);
      alert('Could not submit leave request');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h3>Request Leave</h3>
      <input
        type="date"
        value={date}
        onChange={e => setDate(e.target.value)}
        required
      /><br />
      <textarea
        placeholder="Reason"
        value={reason}
        onChange={e => setReason(e.target.value)}
        required
      /><br />
      <button type="submit">Submit Leave Request</button>
    </form>
  );
}

export default LeaveRequest; 