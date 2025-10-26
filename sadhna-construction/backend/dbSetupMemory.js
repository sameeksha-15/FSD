/**
 * This script sets up a MongoDB Memory Server instance for development purposes.
 * It doesn't require a separate MongoDB installation.
 * 
 * Run this script with: node dbSetupMemory.js
 * 
 * Note: This is for development only. Data will be lost when the process exits.
 */

const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const { MongoMemoryServer } = require('mongodb-memory-server');

console.log('Setting up MongoDB Memory Server...');
console.log('This may take a moment to download and start the MongoDB binary.');

async function setupDatabase() {
  // Create in-memory MongoDB instance
  const mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  
  console.log(`MongoDB Memory Server started at: ${uri}`);
  
  // Connect to the in-memory database
  await mongoose.connect(uri);
  console.log('Connected to MongoDB Memory Server');
  
  // Define schemas
  const UserSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['Admin', 'Manager', 'Supervisor', 'Mason', 'Carpenter', 'Electrician', 'Plumber', 'Painter', 'Helper', 'Worker'], required: true }
  }, { timestamps: true });

  const EmployeeSchema = new mongoose.Schema({
    name: { type: String, required: true },
    role: { type: String, required: true },
    salary: { type: Number, required: true },
    userId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User',
      index: true
    }
  }, { timestamps: true });

  const AttendanceSchema = new mongoose.Schema({
    employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
    date: { type: Date, required: true },
    status: { type: String, enum: ['Present', 'Absent'], required: true }
  });

  const LeaveSchema = new mongoose.Schema({
    employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    reason: { type: String, required: true },
    status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' }
  }, { timestamps: true });

  const ApplicationSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    position: { type: String, required: true, trim: true },
    experience: { type: String, trim: true },
    message: { type: String, trim: true },
    resumePath: { type: String },
    status: {
      type: String,
      enum: ['Pending', 'Shortlisted', 'Rejected', 'Hired'],
      default: 'Pending'
    },
    applicationDate: { type: Date, default: Date.now },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    reviewDate: { type: Date, default: null },
    reviewComments: { type: String, default: '' }
  }, { timestamps: true });

  const PayrollSchema = new mongoose.Schema({
    employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
    month: { type: Number, required: true },
    year: { type: Number, required: true },
    basicSalary: { type: Number, required: true },
    daysPresent: { type: Number, required: true },
    overtime: { type: Number, default: 0 },
    deductions: { type: Number, default: 0 },
    netAmount: { type: Number, required: true },
    generatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    generatedDate: { type: Date, default: Date.now }
  }, { timestamps: true });

  const SiteMonitoringSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    location: { type: String, required: true },
    photos: [{ 
      path: { type: String, required: true },
      caption: { type: String }
    }],
    progress: { type: Number, required: true, min: 0, max: 100 },
    status: { 
      type: String, 
      enum: ['In Progress', 'Completed', 'On Hold', 'Delayed'],
      default: 'In Progress'
    },
    reportedBy: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User',
      required: true
    },
    date: { type: Date, default: Date.now },
    comments: [{
      text: { type: String, required: true },
      author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      timestamp: { type: Date, default: Date.now }
    }]
  }, { timestamps: true });

  // Create models
  const User = mongoose.model('User', UserSchema);
  const Employee = mongoose.model('Employee', EmployeeSchema);
  const Attendance = mongoose.model('Attendance', AttendanceSchema);
  const Leave = mongoose.model('Leave', LeaveSchema);
  const Application = mongoose.model('Application', ApplicationSchema);
  const Payroll = mongoose.model('Payroll', PayrollSchema);

  // Create initial admin user
  console.log('Creating admin user...');
  const hashedAdminPassword = await bcrypt.hash('admin123', 10);
  const adminUser = new User({
    username: 'admin',
    password: hashedAdminPassword,
    role: 'Admin'
  });
  await adminUser.save();
  
  // Create test worker
  console.log('Creating test worker...');
  const hashedWorkerPassword = await bcrypt.hash('worker123', 10);
  const workerUser = new User({
    username: 'worker1',
    password: hashedWorkerPassword,
    role: 'Worker'
  });
  const savedWorker = await workerUser.save();
  
  // Create employee record for worker
  const employee = new Employee({
    name: 'Test Worker',
    role: 'Worker',
    salary: 15000,
    userId: savedWorker._id
  });
  await employee.save();
  
  console.log('\n=== Database Setup Completed ===');
  console.log('MongoDB Memory Server is running and initialized with test data.');
  console.log('\nAdmin User:');
  console.log('  Username: admin');
  console.log('  Password: admin123');
  console.log('\nWorker User:');
  console.log('  Username: worker1');
  console.log('  Password: worker123');
  console.log('\nIMPORTANT: Keep this terminal window running to keep the database available.');
  console.log('Press Ctrl+C to stop the database server when you\'re done.');
  
  // Update server connection string
  console.log('\nTo connect your application to this database:');
  console.log('1. Open another terminal and update your .env file:');
  console.log(`   MONGODB_URI=${uri}`);
  console.log('2. Run your application in the new terminal window');
  
  // Handle graceful shutdown
  process.on('SIGINT', async () => {
    await mongoose.connection.close();
    await mongod.stop();
    console.log('MongoDB Memory Server stopped');
    process.exit(0);
  });
}

setupDatabase().catch(err => {
  console.error('Error setting up database:', err);
  process.exit(1);
}); 