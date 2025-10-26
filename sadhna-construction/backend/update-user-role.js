const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

async function updateUserRole() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Update frank's role to Supervisor
    const result = await User.findOneAndUpdate(
      { username: 'frank' },
      { $set: { role: 'Supervisor' } },
      { new: true }
    );

    if (result) {
      console.log('User updated successfully:', result);
    } else {
      console.log('User not found');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
}

updateUserRole();