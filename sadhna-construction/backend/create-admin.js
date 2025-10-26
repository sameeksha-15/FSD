const mongoose = require('mongoose');
const User = require('./models/User');
const connectDB = require('./config/db');

// Connect to MongoDB
connectDB().then(async () => {
  console.log('Checking if admin user exists...');
  const adminExists = await User.findOne({ username: 'admin' });
  
  if (adminExists) {
    console.log('Admin user already exists');
  } else {
    console.log('Creating admin user...');
    // Admin password: admin123
    const admin = new User({
      username: 'admin',
      password: '$2b$10$v2JX8COQ2K.L4AZexkH3H.xfeLegq3wsS6HXlvtnlWy1ZoAVvri8G',
      role: 'Admin'
    });
    
    await admin.save();
    console.log('Admin user created successfully');
  }
  
  mongoose.connection.close();
}); 