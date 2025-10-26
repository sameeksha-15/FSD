const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config();

// Connect to MongoDB
const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/sadhnaConstruction';
console.log('Connecting to MongoDB:', mongoUri);

mongoose.connect(mongoUri)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Import the SiteMonitoring model
const SiteMonitoring = require('./models/SiteMonitoring');

async function fixImagePaths() {
  try {
    console.log('Fetching all site monitoring reports...');
    const reports = await SiteMonitoring.find({});
    console.log(`Found ${reports.length} reports`);
    
    let updatedCount = 0;
    
    for (const report of reports) {
      let needsUpdate = false;
      
      if (report.photos && report.photos.length > 0) {
        console.log(`\nProcessing report: ${report.title}`);
        
        report.photos = report.photos.map(photo => {
          const oldPath = photo.path;
          
          // Check if path is absolute (contains drive letter or backslashes)
          if (oldPath.includes(':\\') || oldPath.includes('\\')) {
            needsUpdate = true;
            
            // Extract just the filename
            const filename = path.basename(oldPath);
            const newPath = `uploads/site-monitoring/${filename}`;
            
            console.log(`  Fixing: ${oldPath}`);
            console.log(`  New:    ${newPath}`);
            
            return {
              ...photo.toObject(),
              path: newPath
            };
          }
          
          return photo;
        });
        
        if (needsUpdate) {
          await report.save();
          updatedCount++;
          console.log(`  ✓ Updated`);
        } else {
          console.log(`  ✓ Already correct`);
        }
      }
    }
    
    console.log(`\n✅ Done! Updated ${updatedCount} reports`);
    process.exit(0);
  } catch (error) {
    console.error('Error fixing image paths:', error);
    process.exit(1);
  }
}

fixImagePaths();
