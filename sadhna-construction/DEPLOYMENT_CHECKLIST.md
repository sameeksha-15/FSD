# 🚀 Quick Deployment Reference

## Your Credentials & URLs (Fill these in as you go)

### MongoDB Atlas
- **Cluster Name**: ___________________________
- **Username**: sadhna_admin
- **Password**: ___________________________
- **Connection String**: 
  ```
  mongodb+srv://sadhna_admin:PASSWORD@cluster0.xxxxx.mongodb.net/sadhnaConstruction
  ```

### GitHub
- **Repository URL**: https://github.com/___________/sadhna-construction

### Vercel - Backend
- **Project Name**: sadhna-construction-backend
- **Deployment URL**: https://_____________________________.vercel.app

### Vercel - Frontend  
- **Project Name**: sadhna-construction-frontend
- **Deployment URL**: https://_____________________________.vercel.app

---

## Environment Variables

### Backend (.env)
```
MONGODB_URI=mongodb+srv://sadhna_admin:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/sadhnaConstruction
JWT_SECRET=sadhna_secret_2025_construction
FRONTEND_URL=https://your-frontend.vercel.app
PORT=5000
```

### Frontend (.env)
```
REACT_APP_API_URL=https://your-backend.vercel.app
```

---

## Quick Commands

### Push to GitHub
```powershell
cd "d:\field_project - Copy\sadhna-construction"
git add .
git commit -m "Update: description of changes"
git push
```

### Test Locally
```powershell
# Backend
cd backend
npm start

# Frontend (in new terminal)
cd frontend
npm start
```

---

## Default Login Credentials

**Admin**
- Username: `admin`
- Password: (check backend/create-admin.js)

**Test Employee** 
- Username: `manali`
- Role: Supervisor
- Password: (check your database)

---

## Troubleshooting Checklist

- [ ] MongoDB Atlas allows all IPs (0.0.0.0/0)
- [ ] Connection string password is correct (no < or >)
- [ ] Backend FRONTEND_URL matches actual frontend URL
- [ ] Frontend REACT_APP_API_URL matches backend URL
- [ ] Both deployments show "Ready" status on Vercel
- [ ] Browser console shows "Socket connected"

---

## Important Notes

⚠️ **File Uploads on Vercel**
- Uploaded files (images) won't persist on Vercel free tier
- Need Cloudinary or AWS S3 for production file storage

⚠️ **WebSocket Limitations**
- Real-time updates may be limited on Vercel free tier
- Consider Railway.app or Render.com for backend if issues persist

💡 **Cost**
- MongoDB Atlas M0: FREE
- Vercel Hobby: FREE
- GitHub: FREE
- Total: $0/month

---

Save this file for quick reference! ✅
