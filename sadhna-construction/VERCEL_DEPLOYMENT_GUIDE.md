# 🚀 Vercel Deployment Guide for Sadhna Construction Project

This guide will help you deploy your Construction Management System to Vercel with **ZERO prior knowledge**.

---

## 📋 Prerequisites

1. **GitHub Account** - Create one at https://github.com if you don't have
2. **Vercel Account** - Sign up at https://vercel.com (use your GitHub account to sign in)
3. **MongoDB Atlas Account** - Sign up at https://www.mongodb.com/cloud/atlas (FREE tier)

---

## 🗂️ Part 1: Set Up MongoDB Atlas (Database)

### Step 1: Create MongoDB Atlas Account
1. Go to https://www.mongodb.com/cloud/atlas
2. Click **"Try Free"** and sign up
3. Choose **FREE tier** (M0 Sandbox)
4. Select your preferred cloud provider and region (choose nearest to your location)

### Step 2: Create Database
1. Once logged in, click **"Build a Database"**
2. Select **FREE (M0)** tier
3. Choose a cloud provider (AWS recommended) and region
4. Click **"Create"**

### Step 3: Create Database User
1. Under **"Security"** → **"Database Access"**
2. Click **"Add New Database User"**
3. Choose **"Password"** authentication
4. Set username: `sadhna_admin`
5. Set a **strong password** (SAVE THIS - you'll need it!)
6. Database User Privileges: Select **"Atlas admin"**
7. Click **"Add User"**

### Step 4: Allow Network Access
1. Under **"Security"** → **"Network Access"**
2. Click **"Add IP Address"**
3. Click **"Allow Access from Anywhere"** (for Vercel deployment)
4. Click **"Confirm"**

### Step 5: Get Connection String
1. Go to **"Deployment"** → **"Database"**
2. Click **"Connect"** on your cluster
3. Select **"Connect your application"**
4. Copy the connection string (looks like):
   ```
   mongodb+srv://sadhna_admin:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
5. **IMPORTANT**: Replace `<password>` with the password you created in Step 3
6. Add database name at the end:
   ```
   mongodb+srv://sadhna_admin:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/sadhnaConstruction?retryWrites=true&w=majority
   ```

---

## 📦 Part 2: Push Code to GitHub

### Step 1: Install Git (if not installed)
1. Download Git from https://git-scm.com/downloads
2. Install with default settings

### Step 2: Create GitHub Repository
1. Go to https://github.com
2. Click **"New repository"** (green button)
3. Repository name: `sadhna-construction`
4. Set to **Private** (recommended for business projects)
5. **DO NOT** initialize with README
6. Click **"Create repository"**

### Step 3: Push Your Code
Open PowerShell in your project folder and run:

```powershell
# Navigate to your project
cd "d:\field_project - Copy\sadhna-construction"

# Initialize git
git init

# Add all files
git add .

# Commit files
git commit -m "Initial commit - Sadhna Construction Management System"

# Add GitHub remote (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/sadhna-construction.git

# Push to GitHub
git branch -M main
git push -u origin main
```

**Note**: When prompted, enter your GitHub username and password (or Personal Access Token if 2FA is enabled)

---

## 🌐 Part 3: Deploy Backend to Vercel

### Step 1: Login to Vercel
1. Go to https://vercel.com
2. Click **"Sign Up"** and use your GitHub account
3. Authorize Vercel to access your GitHub

### Step 2: Import Backend Project
1. On Vercel dashboard, click **"Add New..."** → **"Project"**
2. Import the `sadhna-construction` repository
3. Click **"Import"**

### Step 3: Configure Backend Deployment
1. **Framework Preset**: Select **"Other"**
2. **Root Directory**: Click **"Edit"** and select `backend`
3. **Build Command**: Leave empty or use `npm install`
4. **Output Directory**: Leave as `.`
5. **Install Command**: `npm install`

### Step 4: Add Environment Variables
Click **"Environment Variables"** and add these:

| Name | Value |
|------|-------|
| `MONGODB_URI` | Paste your MongoDB connection string from Part 1 |
| `JWT_SECRET` | Create a random string (e.g., `sadhna_secret_2025_construction`) |
| `FRONTEND_URL` | Leave empty for now (we'll update after frontend deployment) |

### Step 5: Deploy Backend
1. Click **"Deploy"**
2. Wait 2-3 minutes for deployment
3. Once done, copy the **backend URL** (e.g., `https://your-backend.vercel.app`)

---

## 🎨 Part 4: Deploy Frontend to Vercel

### Step 1: Import Frontend Project
1. On Vercel dashboard, click **"Add New..."** → **"Project"**
2. Import the SAME `sadhna-construction` repository again
3. Click **"Import"**

### Step 2: Configure Frontend Deployment
1. **Framework Preset**: Select **"Create React App"**
2. **Root Directory**: Click **"Edit"** and select `frontend`
3. **Build Command**: `npm run build`
4. **Output Directory**: `build`
5. **Install Command**: `npm install`

### Step 3: Add Frontend Environment Variables
Click **"Environment Variables"** and add:

| Name | Value |
|------|-------|
| `REACT_APP_API_URL` | Paste your backend URL from Part 3 (e.g., `https://your-backend.vercel.app`) |

### Step 4: Deploy Frontend
1. Click **"Deploy"**
2. Wait 2-3 minutes for deployment
3. Once done, you'll get your **frontend URL** (e.g., `https://your-frontend.vercel.app`)

---

## 🔄 Part 5: Update Backend with Frontend URL

### Step 1: Update Backend Environment Variable
1. Go to your **backend project** on Vercel
2. Click **"Settings"** → **"Environment Variables"**
3. Add/Update:
   - **Name**: `FRONTEND_URL`
   - **Value**: Your frontend URL (e.g., `https://your-frontend.vercel.app`)
4. Click **"Save"**

### Step 2: Redeploy Backend
1. Go to **"Deployments"** tab
2. Click the **three dots** on the latest deployment
3. Click **"Redeploy"**
4. Check **"Use existing Build Cache"**
5. Click **"Redeploy"**

---

## ✅ Part 6: Test Your Deployment

1. Open your **frontend URL** in a browser
2. Try to:
   - Register a new account
   - Login as admin
   - Create employees
   - Mark attendance
   - Apply for leave
   - Test real-time updates (open in two browser tabs)

---

## 🔧 Common Issues & Solutions

### Issue 1: "Failed to connect to MongoDB"
**Solution**: 
- Check your MongoDB Atlas connection string
- Make sure you replaced `<password>` with actual password
- Verify Network Access allows all IPs (0.0.0.0/0)

### Issue 2: "CORS Error"
**Solution**:
- Make sure `FRONTEND_URL` is set in backend environment variables
- Redeploy backend after adding frontend URL

### Issue 3: "Real-time updates not working"
**Solution**:
- WebSockets might not work on Vercel free tier
- Consider upgrading Vercel plan or use a different host for backend (e.g., Render.com)

### Issue 4: "Images not uploading"
**Solution**:
- Vercel has read-only file system
- You need to use cloud storage (Cloudinary, AWS S3) for file uploads
- For now, image uploads won't persist on Vercel

---

## 📝 Important Notes

1. **File Uploads**: Vercel's serverless functions have a read-only file system. Uploaded images (site monitoring, applications) won't persist. You'll need to:
   - Use **Cloudinary** (free tier available)
   - Or **AWS S3** for permanent image storage

2. **WebSockets**: Vercel has limited WebSocket support on free tier. Real-time updates might be delayed.

3. **Database**: MongoDB Atlas FREE tier (M0) is sufficient for testing and small deployments.

4. **Environment Variables**: Never commit `.env` files to GitHub. They contain sensitive information.

---

## 🎯 Quick Checklist

- [ ] MongoDB Atlas cluster created
- [ ] Database user created with password saved
- [ ] Network access configured (0.0.0.0/0)
- [ ] Connection string copied and password replaced
- [ ] GitHub repository created
- [ ] Code pushed to GitHub
- [ ] Backend deployed to Vercel
- [ ] Backend environment variables set (MONGODB_URI, JWT_SECRET)
- [ ] Frontend deployed to Vercel
- [ ] Frontend environment variable set (REACT_APP_API_URL)
- [ ] Backend updated with FRONTEND_URL
- [ ] Backend redeployed
- [ ] Application tested and working

---

## 🆘 Need Help?

If you encounter any issues:
1. Check Vercel deployment logs (click on deployment → View Build Logs)
2. Check browser console (F12) for frontend errors
3. Check MongoDB Atlas monitoring for connection issues

---

## 🎉 Success!

Your Construction Management System is now live on the internet! Share your frontend URL with your team to start using it.

**Frontend URL**: `https://your-frontend.vercel.app`
**Backend URL**: `https://your-backend.vercel.app`

---

**Made for Sadhna Construction** 🏗️
