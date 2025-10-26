import React from 'react';

function PureCSS() {
  // Pure inline styles without any external CSS dependencies
  const styles = {
    container: {
      minHeight: '100vh',
      backgroundColor: '#f3f4f6',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '20px'
    },
    heading: {
      fontSize: '2.25rem',
      fontWeight: 'bold',
      color: '#2563eb',
      marginBottom: '1rem'
    },
    grid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      gap: '1rem',
      width: '100%',
      maxWidth: '64rem',
      padding: '1rem'
    },
    redBox: {
      backgroundColor: '#ef4444',
      color: 'white',
      padding: '1rem',
      borderRadius: '0.5rem'
    },
    greenBox: {
      backgroundColor: '#10b981',
      color: 'white',
      padding: '1rem',
      borderRadius: '0.5rem'
    },
    blueBox: {
      backgroundColor: '#3b82f6',
      color: 'white',
      padding: '1rem',
      borderRadius: '0.5rem'
    },
    button: {
      marginTop: '2rem',
      padding: '0.5rem 1rem',
      backgroundColor: '#8b5cf6',
      color: 'white',
      borderRadius: '0.5rem',
      border: 'none',
      cursor: 'pointer'
    },
    text: {
      marginTop: '1rem',
      color: '#4b5563',
      fontStyle: 'italic'
    },
    infoBox: {
      marginTop: '2rem', 
      border: '1px solid #e5e7eb', 
      padding: '1rem', 
      borderRadius: '0.5rem'
    },
    boldText: {
      marginTop: '0.5rem', 
      fontWeight: 'bold'
    }
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.heading}>Pure Inline CSS Test Page</h1>
      
      <div style={styles.grid}>
        <div style={styles.redBox}>
          <p>This box should be red with white text</p>
        </div>
        <div style={styles.greenBox}>
          <p>This box should be green with white text</p>
        </div>
        <div style={styles.blueBox}>
          <p>This box should be blue with white text</p>
        </div>
      </div>
      
      <button style={styles.button}>
        This button should have purple background
      </button>
      
      <p style={styles.text}>
        If you're seeing this with styling, React inline styles are working properly!
      </p>
      
      <div style={styles.infoBox}>
        <p>This page uses only React inline styles</p>
        <p style={styles.boldText}>No external CSS or Tailwind required for this test</p>
      </div>
    </div>
  );
}

export default PureCSS; 