const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();
const jwt = require('jsonwebtoken');

// Import routes
const authRoutes = require('./routes/authRoutes');
const employeeRoutes = require('./routes/employeeRoutes');
const attendanceRoutes = require('./routes/attendanceRoutes');
const payrollRoutes = require('./routes/payrollRoutes');
const leaveRoutes = require('./routes/leaveRoutes');
const applicationRoutes = require('./routes/applicationRoutes');
const siteMonitoringRoutes = require('./routes/siteMonitoringRoutes');

const app = express();
const server = http.createServer(app);

// Socket.IO CORS configuration
const socketCorsOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  process.env.FRONTEND_URL
].filter(Boolean);

const io = new Server(server, {
  cors: {
    origin: function(origin, callback) {
      if (!origin) return callback(null, true);
      
      if (socketCorsOrigins.indexOf(origin) !== -1 || origin.includes('vercel.app')) {
        callback(null, true);
      } else {
        callback(null, true); // Allow all for WebSocket in production
      }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
  }
});
const PORT = process.env.PORT || 5000;

// Configuration for environment variables
// Ensure email configuration is available or set defaults
process.env.EMAIL_SERVICE = process.env.EMAIL_SERVICE || '';
process.env.EMAIL_HOST = process.env.EMAIL_HOST || 'smtp.gmail.com';
process.env.EMAIL_PORT = process.env.EMAIL_PORT || '587';
process.env.EMAIL_USER = process.env.EMAIL_USER || 'sadhnaconstruction@protonmail.com';
process.env.EMAIL_PASS = process.env.EMAIL_PASS || '';
process.env.EMAIL_FROM = process.env.EMAIL_FROM || process.env.EMAIL_USER || 'sadhnaconstruction@protonmail.com';
process.env.EMAIL_SECURE = process.env.EMAIL_SECURE || 'false';

// Log email configuration (without password)
console.log('=== Email Configuration ===');
console.log('Email Service:', process.env.EMAIL_SERVICE);
console.log('Email Host:', process.env.EMAIL_HOST);
console.log('Email Port:', process.env.EMAIL_PORT);
console.log('Email User:', process.env.EMAIL_USER);
console.log('Email From:', process.env.EMAIL_FROM);
console.log('Email Secure:', process.env.EMAIL_SECURE);
console.log('Email Password:', process.env.EMAIL_PASS ? '[CONFIGURED]' : '[NOT CONFIGURED]');
console.log('=========================');

// CORS Configuration
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  process.env.FRONTEND_URL,
  process.env.VERCEL_URL
].filter(Boolean);

app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1 || origin.includes('vercel.app')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Make io available to routes
app.set('io', io);

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
  
  socket.on('error', (error) => {
    console.error('Socket error:', error);
  });
});

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('Created uploads directory');
}

// Create applications upload directory if it doesn't exist
const applicationsDir = path.join(__dirname, 'uploads/applications');
if (!fs.existsSync(applicationsDir)) {
  fs.mkdirSync(applicationsDir, { recursive: true });
  console.log('Created applications upload directory');
}

// Static files (for uploads)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Connect to MongoDB
const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/sadhnaConstruction';
console.log('Attempting to connect to MongoDB...');
console.log('Using connection:', mongoUri);

mongoose.connect(mongoUri)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    console.log('=== MongoDB Connection Failed ===');
    console.log('Please make sure:');
    console.log('1. You have a MongoDB instance running locally or a valid MongoDB Atlas connection string');
    console.log('2. For local MongoDB: MongoDB is installed and running on localhost:27017');
    console.log('3. For MongoDB Atlas: You have an active internet connection');
    console.log('4. For MongoDB Atlas: Your IP address is allowed in MongoDB Atlas Network Access');
    console.log('=== How to set up MongoDB Atlas ===');
    console.log('1. Create a free account at https://www.mongodb.com/cloud/atlas');
    console.log('2. Create a new cluster (the free tier is sufficient)');
    console.log('3. Click "Connect" on your cluster');
    console.log('4. Choose "Connect your application"');
    console.log('5. Copy the connection string and replace <password> with your database user password');
    console.log('6. Add this connection string to your .env file as MONGODB_URI=your_connection_string');
  });

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/payroll', payrollRoutes);
app.use('/api/leaves', leaveRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/site-monitoring', siteMonitoringRoutes);

// Test route for authentication
app.get('/api/test', (req, res) => {
  console.log('Test route accessed - Headers:', req.headers);
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) {
    return res.status(400).json({ 
      message: 'No token provided',
      headers: req.headers
    });
  }
  
  try {
    const secret = process.env.JWT_SECRET || 'yoursecretkey';
    const decoded = jwt.verify(token, secret);
    return res.json({ 
      message: 'Authentication successful', 
      user: decoded,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    return res.status(401).json({ 
      message: 'Invalid token',
      error: err.message 
    });
  }
});

app.get('/', (req, res) => {
  res.send('Welcome to Sadhna Construction Payroll & Attendance API');
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  
  // Handle Multer errors specifically
  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ 
        message: 'File too large. Maximum file size is 5MB.' 
      });
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({ 
        message: 'Invalid file field. Please check the file upload fields.' 
      });
    }
    return res.status(400).json({ 
      message: `File upload error: ${err.message}` 
    });
  }
  
  res.status(500).json({ message: 'Something went wrong!' });
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log('Socket.IO server initialized');
}); 