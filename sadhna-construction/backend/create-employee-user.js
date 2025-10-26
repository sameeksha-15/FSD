const mongoose = require('mongoose');
const User = require('./models/User');
const connectDB = require('./config/db');

// Connect to MongoDB
connectDB().then(async () => {
  console.log('Checking if employee user exists...');
  const employeeExists = await User.findOne({ username: 'employee' });
  
  if (employeeExists) {
    console.log('Employee user already exists');
  } else {
    console.log('Creating employee user...');
    // Employee password: employee123
    const bcrypt = require('bcrypt');
    const hashedPassword = await bcrypt.hash('employee123', 10);
    
    const employee = new User({
      username: 'employee',
      password: hashedPassword,
      role: 'Worker'
    });
    
    await employee.save();
    console.log('Employee user created successfully');
  }
  
  mongoose.connection.close();
}); 