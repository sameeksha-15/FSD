const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { verifyToken, requireRole } = require('../middleware/authMiddleware');
const Application = require('../models/Application');
const User = require('../models/User');
const Employee = require('../models/Employee');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');

// Configure email transporter
let transporter;
try {
  // For production: Configure real email service
  if (process.env.EMAIL_SERVICE) {
    console.log(`Setting up email with service: ${process.env.EMAIL_SERVICE}`);
    console.log(`Using email address: ${process.env.EMAIL_USER}`);
    
    // Create transporter with service-specific configuration
    if (process.env.EMAIL_SERVICE.toLowerCase() === 'protonmail') {
      // Protonmail Bridge configuration (requires Protonmail Bridge running locally)
      transporter = nodemailer.createTransport({
        host: 'localhost', // Protonmail Bridge default
        port: 1025, // Protonmail Bridge default
        auth: {
          user: process.env.EMAIL_USER || 'sadhnaconstruction@protonmail.com',
          pass: process.env.EMAIL_PASS
        },
        tls: {
          rejectUnauthorized: false // For development only
        }
      });
    } else if (process.env.EMAIL_SERVICE.toLowerCase() === 'gmail') {
      // Gmail SMTP configuration
      transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false, // true for 465, false for other ports
        auth: {
          user: process.env.EMAIL_USER || 'sadhnaconstruction@protonmail.com',
          pass: process.env.EMAIL_PASS
        },
        tls: {
          rejectUnauthorized: false // For development only
        }
      });
    } else if (process.env.EMAIL_SERVICE.toLowerCase() === 'ethereal') {
      // Ethereal Email for testing - creates a test account automatically
      console.log('Creating Ethereal test account for email testing...');
      
      // Create Ethereal test account
      nodemailer.createTestAccount()
        .then(testAccount => {
          console.log('Ethereal test account created:');
          console.log('- Email:', testAccount.user);
          console.log('- Password:', testAccount.pass);
          console.log('- Preview URL: https://ethereal.email/login');
          
          // Create reusable transporter using the test account
          transporter = nodemailer.createTransport({
            host: 'smtp.ethereal.email',
            port: 587,
            secure: false, // true for 465, false for other ports
            auth: {
              user: testAccount.user,
              pass: testAccount.pass
            }
          });
          
          // Verify transporter
          transporter.verify(function(error, success) {
            if (error) {
              console.error('Ethereal email verification failed:', error);
            } else {
              console.log('Ethereal email server is ready to send messages');
            }
          });
        })
        .catch(err => {
          console.error('Failed to create Ethereal test account:', err);
        });
    } else if (process.env.EMAIL_SERVICE.toLowerCase() === 'smtp') {
      // Generic SMTP configuration using host and port from environment
      const secure = process.env.EMAIL_SECURE === 'true';
      console.log(`Setting up generic SMTP: ${process.env.EMAIL_HOST}:${process.env.EMAIL_PORT} (secure: ${secure})`);
      
      transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: parseInt(process.env.EMAIL_PORT || '587'),
        secure: secure,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        },
        tls: {
          rejectUnauthorized: false // For development only
        }
      });
    } else {
      // Standard service configuration for other providers
      transporter = nodemailer.createTransport({
        service: process.env.EMAIL_SERVICE,
        auth: {
          user: process.env.EMAIL_USER || 'sadhnaconstruction@protonmail.com',
          pass: process.env.EMAIL_PASS
        }
      });
    }
    
    // Skip verification for Ethereal because it's created asynchronously
    if (process.env.EMAIL_SERVICE.toLowerCase() !== 'ethereal') {
      // Verify transporter configuration
      transporter.verify(function(error, success) {
        if (error) {
          console.error('Email transporter verification failed:', error);
        } else {
          console.log('Email server is ready to send messages');
        }
      });
    }
  } else {
    // For development: Log emails to console
    console.log('Email service not configured. Emails will be logged to console.');
    transporter = {
      sendMail: (mailOptions) => {
        console.log('============ EMAIL WOULD BE SENT ============');
        console.log('To:', mailOptions.to);
        console.log('Subject:', mailOptions.subject);
        console.log('Text:', mailOptions.text);
        console.log('HTML:', mailOptions.html);
        console.log('==========================================');
        return Promise.resolve({ messageId: 'test-message-id' });
      },
      verify: (callback) => {
        callback(null, true);
      }
    };
  }
} catch (error) {
  console.error('Error setting up email transporter:', error);
}

// Helper function to send email
const sendEmail = async (to, subject, text, html) => {
  try {
    if (!transporter) {
      console.log('Email transporter not available');
      return;
    }
    
    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER || 'sadhnaconstruction@protonmail.com',
      to,
      subject,
      text,
      html: html || text
    };
    
    console.log(`Attempting to send email to: ${to}`);
    console.log(`Subject: ${subject}`);
    
    // Send mail with defined transport object
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.messageId);
    
    // Preview URL for Ethereal emails
    if (process.env.EMAIL_SERVICE.toLowerCase() === 'ethereal' && info.messageId) {
      console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
      console.log('View the email at the URL above');
    }
    
    return info;
  } catch (error) {
    console.error('Error sending email:', error);
    console.error('Error details:', error.message);
    if (error.response) {
      console.error('SMTP response:', error.response);
    }
  }
};

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads/applications');
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

// File filter to accept common document and image types
const fileFilter = (req, file, cb) => {
  const allowedFileTypes = ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png'];
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (allowedFileTypes.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PDF, DOC, DOCX, JPG, JPEG, and PNG files are allowed.'), false);
  }
};

// Configure upload with file size limit (5MB)
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

// Create an error handling wrapper for multer
const multerUploadHandler = (handler) => {
  return (req, res, next) => {
    handler(req, res, (err) => {
      if (err) {
        console.error('Multer error:', err);
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ message: 'File too large. Maximum file size is 5MB.' });
        }
        if (err.code === 'LIMIT_UNEXPECTED_FILE') {
          return res.status(400).json({ message: 'Invalid file field. Please check the file upload fields.' });
        }
        return res.status(400).json({ message: `File upload error: ${err.message}` });
      }
      next();
    });
  };
};

// Multiple field upload configuration for worker registration
const registerUpload = multerUploadHandler(
  upload.fields([
    { name: 'idProof', maxCount: 1 },
    { name: 'addressProof', maxCount: 1 },
    { name: 'policeVerification', maxCount: 1 },
    { name: 'photo', maxCount: 1 },
    { name: 'resume', maxCount: 1 }
  ])
);

// Process single resume application
const processApplication = async (req, res) => {
  try {
    const { 
      name, 
      email, 
      phone, 
      position, 
      experience, 
      message 
    } = req.body;

    // Validate required fields
    if (!name || !email || !phone || !position) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    // Create application object
    const newApplication = new Application({
      name,
      email,
      phone,
      position,
      experience: experience || '',
      message: message || '',
      resumePath: req.file ? req.file.path : null,
      applicationDate: new Date(),
      status: 'Pending'
    });

    // Save to database
    await newApplication.save();

    // Send success response
    res.status(201).json({ 
      message: 'Application submitted successfully', 
      applicationId: newApplication._id 
    });
  } catch (error) {
    console.error('Error processing application:', error);
    res.status(500).json({ message: 'Failed to process application. Please try again later.' });
  }
};

// Process full worker registration with multiple documents
const processWorkerRegistration = async (req, res) => {
  try {
    // Log the files received for debugging
    console.log('Files received:', req.files ? Object.keys(req.files) : 'No files');
    console.log('Form data:', req.body);
    
    const {
      fullName,
      surname,
      email,
      phone,
      dateOfBirth,
      gender,
      address,
      city,
      state,
      pincode,
      emergencyContact,
      position,
      experience,
      username,
      password,
      expectedSalary,
      additionalInfo
    } = req.body;

    // Validate required fields
    if (!fullName || !surname || !email || !phone || !position || !username || !password) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    // Age validation - check if 18 years or older
    if (dateOfBirth) {
      const birthDate = new Date(dateOfBirth);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      
      // Adjust age if birth month is after current month 
      // or if birth month is the same but birth day is after current day
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      
      if (age < 18) {
        return res.status(400).json({ message: 'You must be at least 18 years old to apply' });
      }
    }

    // Check if username already exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: 'Username already exists. Please choose another username.' });
    }

    // Create file paths object
    const filePaths = {};
    if (req.files) {
      Object.keys(req.files).forEach(fieldName => {
        if (req.files[fieldName] && req.files[fieldName].length > 0) {
          filePaths[fieldName] = req.files[fieldName][0].path;
        }
      });
    }

    // Create application object
    const newApplication = new Application({
      name: `${fullName} ${surname}`,
      email,
      phone,
      position,
      address: `${address}, ${city}, ${state}, ${pincode}`,
      experience: experience || '',
      message: additionalInfo || '',
      idProofPath: filePaths.idProof || null,
      addressProofPath: filePaths.addressProof || null,
      policeVerificationPath: filePaths.policeVerification || null,
      photoPath: filePaths.photo || null,
      resumePath: filePaths.resume || null,
      dateOfBirth,
      gender,
      emergencyContact: emergencyContact || '',
      expectedSalary: expectedSalary || '',
      username,
      applicationDate: new Date(),
      status: 'Pending'
    });

    // Save to database
    await newApplication.save();

    // Send success response
    res.status(201).json({ 
      message: 'Registration successful! Your application is under review. We will contact you soon.',
      applicationId: newApplication._id 
    });
  } catch (error) {
    console.error('Error processing worker registration:', error);
    // Provide more specific error messages
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        message: 'Validation error. Please check your form data.',
        details: Object.values(error.errors).map(e => e.message)
      });
    }
    if (error.name === 'MongoError' && error.code === 11000) {
      return res.status(400).json({ 
        message: 'This username or email is already registered.'
      });
    }
    res.status(500).json({ 
      message: 'Failed to process registration. Please try again later.'
    });
  }
};

// Route to register a new worker with multiple documents
router.post('/register', registerUpload, processWorkerRegistration);

// Simple application routes (legacy)
router.post('/apply', multerUploadHandler(upload.single('resume')), processApplication);

// Route to get all applications (admin only)
router.get('/', verifyToken, requireRole('Admin', 'Manager'), async (req, res) => {
  try {
    const applications = await Application.find().sort({ applicationDate: -1 });
    res.status(200).json(applications);
  } catch (error) {
    console.error('Error fetching applications:', error);
    res.status(500).json({ message: 'Failed to fetch applications' });
  }
});

// Route to update application status
router.put('/:id/status', verifyToken, requireRole('Admin', 'Manager'), async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!['Pending', 'Shortlisted', 'Rejected', 'Hired'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status value' });
    }
    
    const application = await Application.findById(id);
    
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }
    
    // Update status and review information
    application.status = status;
    application.reviewedBy = req.user._id;
    application.reviewDate = new Date();
    
    await application.save();
    
    res.status(200).json({ message: 'Application status updated successfully' });
  } catch (error) {
    console.error('Error updating application status:', error);
    res.status(500).json({ message: 'Failed to update application status' });
  }
});

// Route to download resume
router.get('/:id/resume', verifyToken, requireRole('Admin', 'Manager'), async (req, res) => {
  try {
    const { id } = req.params;
    
    const application = await Application.findById(id);
    
    if (!application || !application.resumePath) {
      return res.status(404).json({ message: 'Resume not found' });
    }
    
    res.download(application.resumePath);
  } catch (error) {
    console.error('Error downloading resume:', error);
    res.status(500).json({ message: 'Failed to download resume' });
  }
});

// Route to download other documents
router.get('/:id/document/:documentType', verifyToken, requireRole('Admin', 'Manager'), async (req, res) => {
  try {
    const { id, documentType } = req.params;
    
    const application = await Application.findById(id);
    
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }
    
    let documentPath;
    let documentName;
    
    switch(documentType) {
      case 'idProof':
        documentPath = application.idProofPath;
        documentName = 'ID Proof';
        break;
      case 'addressProof':
        documentPath = application.addressProofPath;
        documentName = 'Address Proof';
        break;
      case 'policeVerification':
        documentPath = application.policeVerificationPath;
        documentName = 'Police Verification';
        break;
      case 'photo':
        documentPath = application.photoPath;
        documentName = 'Photo';
        break;
      case 'resume':
        documentPath = application.resumePath;
        documentName = 'Resume';
        break;
      default:
        return res.status(400).json({ message: 'Invalid document type' });
    }
    
    if (!documentPath) {
      return res.status(404).json({ message: `${documentName} not found` });
    }
    
    // Check if this is a photo request
    if (documentType === 'photo') {
      // For photos, serve the file directly instead of triggering a download
      res.sendFile(path.resolve(documentPath));
    } else {
      // For other documents, trigger a download
      res.download(documentPath);
    }
  } catch (error) {
    console.error('Error downloading document:', error);
    res.status(500).json({ message: 'Failed to download document' });
  }
});

// Route to create employee account from application
router.post('/:id/hire', verifyToken, requireRole('Admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { salary, role } = req.body;
    
    if (!salary || !role) {
      return res.status(400).json({ message: 'Please provide salary and role' });
    }
    
    const application = await Application.findById(id);
    
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }
    
    if (application.status === 'Hired') {
      return res.status(400).json({ message: 'This applicant has already been hired' });
    }
    
    // Use existing username from application if available
    const username = application.username || application.name.toLowerCase().replace(/\s+/g, '_');
    const password = application.password || application.position.toLowerCase() + Math.floor(1000 + Math.random() * 9000);
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Normalize role to proper casing (handle both lowercase and capitalized inputs)
    const roleLower = (role || 'worker').toLowerCase();
    const normalizedRole = roleLower === 'supervisor' ? 'Supervisor' :
                         roleLower === 'manager' ? 'Manager' :
                         roleLower === 'admin' ? 'Admin' : 'Worker';

    console.log(`Creating user - Input role: "${role}", Normalized role: "${normalizedRole}"`);

    // Create user account
    const newUser = new User({
      username,
      password: hashedPassword,
      role: normalizedRole
    });
    
    const savedUser = await newUser.save();
    
    console.log(`User created successfully with role: ${savedUser.role}`);
    
    // Create employee record with normalized role
    const newEmployee = new Employee({
      name: application.name,
      role: normalizedRole,
      salary: parseFloat(salary),
      userId: savedUser._id
    });
    
    await newEmployee.save();
    
    console.log(`Employee record created with role: ${newEmployee.role}`);
    
    // Update application status
    application.status = 'Hired';
    application.userId = savedUser._id;
    application.reviewedBy = req.user._id;
    application.reviewDate = new Date();
    application.reviewComments = `Hired as ${normalizedRole} with salary Rs.${salary}`;
    
    await application.save();

    // Get the admin user info for the email
    const adminUser = await User.findById(req.user._id);
    const adminName = adminUser ? adminUser.username : 'HR Manager';
    
    // Set deadline date for onboarding (7 days from now)
    const deadlineDate = new Date();
    deadlineDate.setDate(deadlineDate.getDate() + 7);
    const formattedDeadline = deadlineDate.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });

    // Prepare email HTML content
    const emailHtml = `
      <h2>Congratulations! Offer of Employment at Sadhna Construction</h2>
      <p>Greetings from Sadhna Construction!</p>
      
      <p>We are pleased to inform you that you have been selected for the position of <strong>${application.position}</strong> at Sadhna Construction.
      Your skills and experience align well with our vision, and we are excited to have you as part of our growing team.</p>
      
      <p>Below are your login credentials to access the Sadhna Construction Employee Portal:</p>
      
      <ul>
          <li><strong>Username:</strong> ${username}</li>
          <li><strong>Password:</strong> ${password}</li>
      </ul>
      
      <p>Upon your first login, you will be prompted to change your password for security purposes.</p>
      
      <h3>Next Steps:</h3>
      <ul>
          <li>Kindly log in to the portal and complete the onboarding formalities.</li>
          <li>Review and acknowledge the employment terms and conditions.</li>
      </ul>
      
      <h3>Important Instructions:</h3>
      <ul>
          <li>Please ensure that you complete the onboarding process before ${formattedDeadline}.</li>
          <li>If you face any technical issues while logging in, kindly reach out to support@sadhnaconstruction.com.</li>
      </ul>
      
      <p>We look forward to working with you and witnessing your contributions to Sadhna Construction's success!</p>
      
      <p>Welcome aboard!</p>
      
      <p>Best Regards,<br>
      ${adminName}<br>
      HR Department<br>
      Sadhna Construction<br>
      +91-7965412380 | sadhnaconstruction@protonmail.com | www.sadhnaconstruction.com</p>
    `;

    // Send email notification if email is available
    if (application.email) {
      try {
        await sendEmail(
          application.email,
          'Congratulations! Offer of Employment at Sadhna Construction',
          `Congratulations! You have been selected for the position of ${application.position} at Sadhna Construction. Your username is ${username} and your password is ${password}.`,
          emailHtml
        );
      } catch (emailError) {
        console.error('Failed to send email, but account creation succeeded:', emailError);
        console.log('============ EMAIL WOULD HAVE BEEN SENT ============');
        console.log('To:', application.email);
        console.log('Subject: Congratulations! Offer of Employment at Sadhna Construction');
        console.log('HTML Content:', emailHtml);
        console.log('==========================================');
      }
    }
    
    res.status(201).json({
      message: 'Employee account created successfully',
      employeeInfo: {
        username,
        password: password, // Sent only once for initial login
        role: normalizedRole // Return the normalized role
      }
    });
  } catch (error) {
    console.error('Error creating employee account:', error);
    res.status(500).json({ message: 'Failed to create employee account' });
  }
});

module.exports = router; 