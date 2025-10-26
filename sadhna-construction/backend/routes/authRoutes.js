const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const secret = process.env.JWT_SECRET || 'yoursecretkey';

// Register route (optional)
router.post('/register', async (req, res) => {
  const { username, password, role } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ username, password: hashedPassword, role });
    await user.save();
    res.status(201).json({ message: 'User registered' });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Login route
router.post('/login', async (req, res) => {
  const { username, password, role } = req.body;
  try {
    console.log("Login attempt for:", { username, requestedRole: role });
    
    const user = await User.findOne({ username });
    if (!user) {
      console.log(`User not found: ${username}`);
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    
    console.log(`Found user: ${username}, Role: ${user.role}, Requested Role: ${role}`);
    
    // Role-based login verification
    if (role) {
      if (role === 'Admin') {
        // Admin login should only allow Admin users
        if (user.role !== 'Admin') {
          console.log(`Admin login rejected - User role: ${user.role}`);
          return res.status(403).json({ message: 'Access denied. Admin credentials required.' });
        }
      } else if (role === 'Worker') {
        // Employee login should allow Worker, Supervisor, and Manager (non-Admin users)
        if (user.role === 'Admin') {
          console.log(`Employee login rejected - User is Admin`);
          return res.status(403).json({ message: 'Please use admin login for admin accounts.' });
        }
        console.log(`Employee login accepted - User role: ${user.role}`);
      }
    }
    
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      console.log(`Invalid password for user: ${username}`);
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    
    const token = jwt.sign(
      { 
        _id: user._id, 
        role: user.role, 
        username: user.username 
      }, 
      secret, 
      { expiresIn: '1d' }
    );
    
    console.log(`Successful login for ${username} with role ${user.role}`);
    
    // Send user data in response
    res.json({
      _id: user._id,
      token,
      role: user.role,
      username: user.username,
      user: {
        _id: user._id,
        username: user.username,
        role: user.role
      }
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ 
      message: 'An error occurred during login',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

// Add a route to fetch user data
router.get('/me', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user._id, '-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({
      _id: user._id,
      username: user.username,
      role: user.role
    });
  } catch (err) {
    console.error("Error fetching user profile:", err);
    res.status(500).json({ message: err.message });
  }
});

// Middleware to verify token
function verifyToken(req, res, next) {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Access token missing' });
  try {
    const decoded = jwt.verify(token, secret);
    req.user = decoded; // contains _id and role
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid token' });
  }
}

module.exports = router; 