import React from 'react';
import './styles.css';

function TestStyles() {
  return (
    <div className="container">
      <h1 className="heading">CSS Styling Test Page</h1>
      
      <div className="grid">
        <div className="red-box">
          <p>This box should be red with white text</p>
        </div>
        <div className="green-box">
          <p>This box should be green with white text</p>
        </div>
        <div className="blue-box">
          <p>This box should be blue with white text</p>
        </div>
      </div>
      
      <button className="button">
        This button should have purple background
      </button>
      
      <p className="text">
        If you're seeing this with styling, CSS is working properly!
      </p>
      
      <div className="info-box">
        <p>This page uses traditional CSS classes from styles.css</p>
        <p className="bold-text">No Tailwind required for this test</p>
      </div>
    </div>
  );
}

export default TestStyles; 