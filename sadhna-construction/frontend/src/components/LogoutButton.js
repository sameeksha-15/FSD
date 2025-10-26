import React from 'react';

function LogoutButton({ onLogout }) {
  const handleLogout = () => {
    // Remove token and user role from localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    // Optionally call a parent function to update app state
    if (onLogout) {
      onLogout();
    }
  };

  return (
    <button 
      onClick={handleLogout}
      style={{
        padding: '8px 15px',
        backgroundColor: '#f44336',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer'
      }}
    >
      Logout
    </button>
  );
}

export default LogoutButton; 