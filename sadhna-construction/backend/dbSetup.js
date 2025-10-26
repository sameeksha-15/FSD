const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const fs = require('fs');
const path = require('path');

// Check if .env file exists, if not create it with MongoDB instructions
const envPath = path.join(__dirname, '.env');
if (!fs.existsSync(envPath)) {
  const envContent = `# MongoDB Atlas Connection String
# Replace the connection string below with your own MongoDB Atlas connection string
# or use a local MongoDB instance with mongodb://localhost:27017/sadhnaConstruction
MONGODB_URI=mongodb://localhost:27017/sadhnaConstruction`;

  fs.writeFileSync(envPath, envContent);
  console.log('.env file created with MongoDB connection instructions');
}

// Load environment variables
require('dotenv').config();

// Get MongoDB URI from environment or use local fallback
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/sadhnaConstruction';

console.log('Attempting to connect to MongoDB...');
console.log(`Using connection: ${MONGODB_URI.replace(/mongodb(\+srv)?:\/\/([^:]+):([^@]+)@/, 'mongodb$1://$2:****@')}`);

// Connect to MongoDB
mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB successfully');
    setupDatabase();
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    console.log('\n=== MongoDB Connection Failed ===');
    console.log('Please make sure:');
    console.log('1. You have a MongoDB instance running locally or a valid MongoDB Atlas connection string');
    console.log('2. For local MongoDB: MongoDB is installed and running on localhost:27017');
    console.log('3. For MongoDB Atlas: You have an active internet connection');
    console.log('4. For MongoDB Atlas: Your IP address is allowed in MongoDB Atlas Network Access');
    console.log('\n=== How to set up MongoDB Atlas ===');
    console.log('1. Create a free account at https://www.mongodb.com/cloud/atlas');
    console.log('2. Create a new cluster (the free tier is sufficient)');
    console.log('3. Click "Connect" on your cluster');
    console.log('4. Choose "Connect your application"');
    console.log('5. Copy the connection string and replace <password> with your database user password');
    console.log('6. Add this connection string to your .env file as MONGODB_URI=your_connection_string');
    process.exit(1);
  });

// Define schemas
const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['Admin', 'Manager', 'Worker'], required: true }
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

// Create models
const User = mongoose.model('User', UserSchema);
const Employee = mongoose.model('Employee', EmployeeSchema);
const Attendance = mongoose.model('Attendance', AttendanceSchema);
const Leave = mongoose.model('Leave', LeaveSchema);
const Application = mongoose.model('Application', ApplicationSchema);
const Payroll = mongoose.model('Payroll', PayrollSchema);

// Create initial admin user
const createAdminUser = async () => {
  try {
    // Check if an admin already exists
    const existingAdmin = await User.findOne({ role: 'Admin' });
    if (existingAdmin) {
      console.log('Admin user already exists');
      return;
    }

    // Create a new admin user
    const hashedPassword = await bcrypt.hash('admin123', 10);
    const adminUser = new User({
      username: 'admin',
      password: hashedPassword,
      role: 'Admin'
    });

    await adminUser.save();
    console.log('Admin user created successfully');
    console.log('Username: admin');
    console.log('Password: admin123');
  } catch (error) {
    console.error('Error creating admin user:', error);
  }
};

// Function to create a test worker user and employee
const createTestWorker = async () => {
  try {
    // Check if a worker already exists
    const existingWorker = await User.findOne({ role: 'Worker' });
    if (existingWorker) {
      console.log('Worker user already exists');
      return;
    }

    // Create a worker user
    const hashedPassword = await bcrypt.hash('worker123', 10);
    const workerUser = new User({
      username: 'worker1',
      password: hashedPassword,
      role: 'Worker'
    });

    const savedWorker = await workerUser.save();
    
    // Create corresponding employee record
    const employee = new Employee({
      name: 'Test Worker',
      role: 'Worker',
      salary: 15000,
      userId: savedWorker._id
    });

    await employee.save();
    console.log('Test worker and employee created successfully');
    console.log('Username: worker1');
    console.log('Password: worker123');
  } catch (error) {
    console.error('Error creating test worker:', error);
  }
};

// Run setup functions
const setupDatabase = async () => {
  try {
    console.log('Creating initial data...');
    await createAdminUser();
    await createTestWorker();
    
    console.log('\nDatabase setup completed successfully');
    console.log('You can now use the application with the created users');
  } catch (error) {
    console.error('Database setup failed:', error);
  } finally {
    // Close the connection after a small delay to ensure everything is saved
    setTimeout(() => {
      mongoose.connection.close();
      console.log('Database connection closed');
    }, 2000);
  }
}; 