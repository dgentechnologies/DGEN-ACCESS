# Quick Start Guide

Get up and running with DGEN Access Control System in 15 minutes!

## Prerequisites

- Node.js 16+ installed
- npm installed
- Firebase account (free tier is fine)
- 15 minutes of your time ⏱️

## Step 1: Clone & Setup (2 minutes)

```bash
# Clone the repository
git clone https://github.com/MrTG1B/DGEN-ACESS.git
cd DGEN-ACESS

# Run automatic setup
chmod +x setup.sh
./setup.sh
```

This installs all dependencies for both frontend and backend.

## Step 2: Firebase Setup (5 minutes)

### Create Firebase Project
1. Go to https://console.firebase.google.com
2. Click "Add project"
3. Name: "dgen-access" (or your choice)
4. Disable Analytics (or enable if you want)
5. Click "Create project"

### Enable Databases
1. **Firestore**: Build → Firestore Database → Create database → Production mode → Select location
2. **Realtime DB**: Build → Realtime Database → Create database → Locked mode → Select location

### Get Credentials

**For Backend:**
1. Go to Project Settings (⚙️) → Service Accounts
2. Click "Generate new private key"
3. Save the JSON file
4. Open it and copy values to `backend/.env`:

```env
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project-id.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYourPrivateKeyHere\n-----END PRIVATE KEY-----\n"
FIREBASE_DATABASE_URL=https://your-project-id.firebaseio.com
```

**For Frontend:**
1. Project Settings → General → Your apps
2. Click Web icon (</>)
3. Register app: "DGEN Dashboard"
4. Copy config values to `frontend/.env`:

```env
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123
VITE_FIREBASE_DATABASE_URL=https://your-project-id.firebaseio.com
```

## Step 3: Deploy Firebase Rules (3 minutes)

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize (select Firestore and Realtime Database)
firebase init

# Deploy security rules
firebase deploy --only firestore:rules,database
```

## Step 4: Start the Application (1 minute)

Open **two terminals**:

**Terminal 1 - Backend:**
```bash
cd backend
npm start
```

Wait for: `Server running on: http://localhost:5000`

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

Wait for: `Local: http://localhost:3000`

## Step 5: Access Dashboard (1 minute)

1. Open browser: http://localhost:3000
2. You should see the Dashboard with statistics
3. Default super admin users are automatically created:
   - DGEN-EX-01: Tirthankar Dasgupta (CEO & CTO)
   - DGEN-FI-02: Sukomal Debnath (CFO)
   - DGEN-OP-03: Arpan Bairagi (COO)
   - DGEN-MK-04: Sagnik Mandal (CMO)

## Step 6: Test the System (3 minutes)

### Test 1: Add an Employee
1. Click "Employees" in sidebar
2. Click "Add Employee"
3. Fill in:
   - ID: DGEN-TE-01
   - Name: Test User
   - Role: Tester
4. Click "Add Employee"
5. You should see the new user in the table

### Test 2: Test ESP32 Endpoint
```bash
# Grant access test
curl -X POST http://localhost:5000/verify -d "data=DGEN-EX-01"
# Should return: YES

# Deny access test
curl -X POST http://localhost:5000/verify -d "data=INVALID-ID"
# Should return: NO
```

### Test 3: Check Logs
1. Click "Logs" in sidebar
2. You should see the access attempts from the curl tests
3. Real-time updates indicator should be green

## You're Done! 🎉

Your system is now running and ready to use.

## Next Steps

### Add More Employees
Go to Employees page and add all your team members.

### Update ESP32 Code
In your ESP32 code, update the server URL:
```cpp
const char* serverUrl = "http://YOUR-SERVER-IP:5000/verify";
```

### Deploy to Production
Choose a deployment method:

**Quick Deploy (Firebase Hosting + Cloud Run):**
```bash
# Backend
cd backend
gcloud run deploy dgen-backend --source .

# Frontend
cd frontend
npm run build
firebase deploy --only hosting
```

**Docker Deploy:**
```bash
docker-compose up -d
```

## Troubleshooting

### Backend won't start
```bash
# Check Node version
node -v  # Should be v16 or higher

# Check .env file exists
ls backend/.env

# Check Firebase credentials
cd backend
cat .env | grep FIREBASE_PROJECT_ID
```

### Frontend won't connect
```bash
# Check backend is running
curl http://localhost:5000/health

# Check .env file
ls frontend/.env

# Check API URL
cd frontend
cat .env | grep VITE_API_URL
# Should be: http://localhost:5000
```

### Firebase errors
```bash
# Redeploy rules
firebase deploy --only firestore:rules,database

# Check Firebase console for errors
# https://console.firebase.google.com
```

## Need Help?

- 📖 Full documentation: [README_v2.md](README_v2.md)
- 🔄 Migration from old version: [MIGRATION.md](MIGRATION.md)
- 🐛 Issues: Open an issue on GitHub
- 💬 Contact: Development team

## Summary

✅ Installed dependencies (setup.sh)
✅ Created Firebase project
✅ Enabled Firestore & Realtime DB
✅ Configured backend/.env
✅ Configured frontend/.env
✅ Deployed Firebase rules
✅ Started backend (port 5000)
✅ Started frontend (port 3000)
✅ Tested dashboard
✅ Tested ESP32 endpoint
✅ Ready for production!

Total time: ~15 minutes 🚀
