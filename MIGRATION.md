# Migration Guide: Flask to React + Node.js + Firebase

This guide helps you migrate from the old Flask-based system to the new React + Node.js + Firebase architecture.

## Overview

### What Changed

**Before (v1.0):**
- Python Flask backend
- Single HTML dashboard
- In-memory storage (lost on restart)
- Deployed on Vercel serverless

**After (v2.0):**
- Node.js Express backend
- React + Vite frontend
- Firebase Firestore + Realtime Database
- Can be deployed anywhere (Docker, Cloud, etc.)

### What Stayed The Same

✅ **ESP32 Endpoint**: The `/verify` endpoint works exactly the same way
✅ **User Data Format**: Same user structure with ID, name, role, status
✅ **Super Admin Users**: Same 4 executive users protected from deletion
✅ **API Response Format**: ESP32 still gets "YES" or "NO" responses

## Step-by-Step Migration

### Step 1: Backup Your Data (Optional)

If you were running the old system and have users you want to keep:

1. Go to the old dashboard
2. Note down all user information
3. You'll re-add them in the new system

### Step 2: Firebase Setup

1. **Create Firebase Project**
   - Go to https://console.firebase.google.com
   - Click "Add project"
   - Name it (e.g., "dgen-access-control")
   - Disable Google Analytics (optional)

2. **Enable Databases**
   - Go to "Build" → "Firestore Database" → "Create database"
   - Start in production mode
   - Choose a location
   - Go to "Build" → "Realtime Database" → "Create database"
   - Start in locked mode

3. **Get Service Account (Backend)**
   - Go to Project Settings → Service Accounts
   - Click "Generate new private key"
   - Save the JSON file
   - Extract values for backend/.env:
     ```
     FIREBASE_PROJECT_ID=your-project-id
     FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@...
     FIREBASE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\n...\n-----END...
     FIREBASE_DATABASE_URL=https://your-project-id.firebaseio.com
     ```

4. **Get Web Config (Frontend)**
   - Go to Project Settings → General
   - Scroll to "Your apps"
   - Click web icon (</>)
   - Register app
   - Copy config values to frontend/.env:
     ```
     VITE_FIREBASE_API_KEY=...
     VITE_FIREBASE_AUTH_DOMAIN=...
     VITE_FIREBASE_PROJECT_ID=...
     VITE_FIREBASE_STORAGE_BUCKET=...
     VITE_FIREBASE_MESSAGING_SENDER_ID=...
     VITE_FIREBASE_APP_ID=...
     VITE_FIREBASE_DATABASE_URL=...
     ```

### Step 3: Install and Configure

```bash
# Clone or update repository
git pull origin main

# Run setup script
chmod +x setup.sh
./setup.sh

# Configure backend
cd backend
cp .env.example .env
nano .env  # Add Firebase credentials

# Configure frontend
cd ../frontend
cp .env.example .env
nano .env  # Add Firebase credentials
```

### Step 4: Deploy Firebase Rules

```bash
# Install Firebase CLI (if not installed)
npm install -g firebase-tools

# Login
firebase login

# Initialize project
firebase init
# Select:
# - Firestore
# - Realtime Database
# - (Optional) Hosting

# Deploy rules
firebase deploy --only firestore:rules,database
```

### Step 5: Start the Application

**Development Mode:**
```bash
# Terminal 1 - Backend
cd backend
npm start

# Terminal 2 - Frontend
cd frontend
npm run dev
```

**Or using root package.json:**
```bash
npm run dev
```

### Step 6: Migrate Your Data

The system will automatically create the 4 super admin users on first backend startup:
- DGEN-EX-01: Tirthankar Dasgupta
- DGEN-FI-02: Sukomal Debnath
- DGEN-OP-03: Arpan Bairagi
- DGEN-MK-04: Sagnik Mandal

**To add other users:**
1. Open http://localhost:3000
2. Go to "Employees" page
3. Click "Add Employee"
4. Enter user details
5. Click "Add Employee"

### Step 7: Update ESP32 Configuration

Your ESP32 code should work without changes! Just update the server URL:

**Before:**
```cpp
const char* serverUrl = "https://your-vercel-app.vercel.app/verify";
```

**After:**
```cpp
const char* serverUrl = "http://your-server-ip:5000/verify";
// Or if using domain:
const char* serverUrl = "https://your-domain.com/verify";
```

## Deployment Options

### Option 1: Docker (Recommended)

```bash
# Build and run with Docker Compose
docker-compose up -d

# Backend: http://localhost:5000
# Frontend: http://localhost:3000
```

### Option 2: Heroku

**Backend:**
```bash
cd backend
heroku create dgen-access-backend
heroku config:set FIREBASE_PROJECT_ID=xxx ...
git subtree push --prefix backend heroku main
```

**Frontend:**
```bash
cd frontend
npm run build
# Deploy to Vercel, Netlify, or Firebase Hosting
```

### Option 3: Google Cloud

```bash
# Backend - Cloud Run
gcloud run deploy dgen-backend --source backend/

# Frontend - Cloud Storage + CDN
cd frontend
npm run build
gsutil -m cp -r build/* gs://your-bucket/
```

## Testing the Migration

### 1. Test Dashboard Access
- Open http://localhost:3000
- You should see the dashboard with statistics
- Check all 4 pages: Dashboard, Employees, Logs, Settings

### 2. Test Employee Management
- Add a test user
- Toggle their status (ban/unban)
- Delete the test user
- Verify you cannot delete super admins

### 3. Test ESP32 Endpoint

**Using curl:**
```bash
# Test with user ID
curl -X POST http://localhost:5000/verify \
  -d "data=DGEN-EX-01"

# Should return: YES

# Test with invalid user
curl -X POST http://localhost:5000/verify \
  -d "data=INVALID-ID"

# Should return: NO
```

**Using Postman:**
1. POST http://localhost:5000/verify
2. Body: form-data
3. Key: data, Value: DGEN-EX-01
4. Send - should get "YES"

### 4. Test Real-time Logs
1. Open dashboard on two browsers/tabs
2. Send a verification request (curl or ESP32)
3. Watch logs update in real-time on both tabs

## Troubleshooting

### Backend won't start
```bash
# Check Node version
node -v  # Should be 16+

# Check Firebase credentials
cd backend
cat .env | grep FIREBASE

# Test Firebase connection
node -e "require('./config/firebase')"
```

### Frontend won't connect
```bash
# Check API URL
cd frontend
cat .env | grep VITE_API_URL

# Should be: http://localhost:5000

# Check backend is running
curl http://localhost:5000/health
```

### Firebase permission denied
```bash
# Redeploy rules
firebase deploy --only firestore:rules,database

# Check rules in Firebase Console
# Go to Firestore → Rules
# Go to Realtime Database → Rules
```

## Rollback Plan

If you need to go back to the old system:

```bash
# Checkout old version
git checkout <commit-before-migration>

# Or use the old files
cd api
python index.py
```

The old system files are still in the repository for reference.

## Getting Help

- Check `README_v2.md` for detailed documentation
- Check `backend/routes/` for API endpoint code
- Check `frontend/src/pages/` for UI component code
- Contact development team for assistance

## Summary Checklist

- [ ] Firebase project created
- [ ] Firestore enabled
- [ ] Realtime Database enabled
- [ ] Service account credentials obtained
- [ ] Web app credentials obtained
- [ ] Backend .env configured
- [ ] Frontend .env configured
- [ ] Dependencies installed
- [ ] Firebase rules deployed
- [ ] Backend running on port 5000
- [ ] Frontend running on port 3000
- [ ] Dashboard accessible
- [ ] ESP32 endpoint tested
- [ ] Real-time logs working
- [ ] Production deployment planned

---

Welcome to DGEN Access Control System v2.0! 🎉
