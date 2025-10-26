# MongoDB Installation Guide for Windows

This guide will help you install MongoDB Community Edition on Windows for your Sadhna Construction project.

## Step 1: Download MongoDB Community Server

1. Go to the MongoDB Community Server download page: https://www.mongodb.com/try/download/community
2. Select the following options:
   - Version: 6.0.6 (or the latest available)
   - Platform: Windows
   - Package: MSI
3. Click "Download" and save the installer to your computer

## Step 2: Install MongoDB

1. Run the downloaded MSI installer
2. Click "Next" to begin the installation process
3. Accept the license agreement and click "Next"
4. Choose "Complete" installation and click "Next"
5. **Important**: Check the box for "Install MongoDB as a Service" to ensure MongoDB starts automatically
6. Keep the default Service Configuration settings and click "Next"
7. Uncheck "Install MongoDB Compass" (unless you want the MongoDB GUI tool) to speed up installation
8. Click "Install" to begin the installation
9. Click "Finish" when the installation is complete

## Step 3: Verify the Installation

1. Open Command Prompt (or PowerShell) as Administrator
2. Check if MongoDB is running with the service command:
   ```
   sc query MongoDB
   ```
3. If it shows "RUNNING", MongoDB is successfully installed and running
4. If it's not running, start the service with:
   ```
   net start MongoDB
   ```

## Step 4: Run the Database Setup Script

Once MongoDB is installed and running, you can create the database for Sadhna Construction by running:

```
cd sadhna-construction\backend
node dbSetup.js
```

This will create all the necessary collections and initial data in your local MongoDB instance.

## Troubleshooting

1. **Service Fails to Start**: Make sure you're running Command Prompt as Administrator
2. **Connection Errors**: Verify MongoDB is running with `sc query MongoDB`
3. **Port Issues**: Check if the default port 27017 is available and not blocked by a firewall

## Database Management

You can manage your MongoDB database visually using MongoDB Compass, which you can download from:
https://www.mongodb.com/try/download/compass 