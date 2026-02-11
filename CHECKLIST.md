# 📋 Setup Checklist

Use this checklist to set up your DGEN Access Control System v2.0

## Prerequisites ✓

- [ ] Node.js 16+ installed (`node -v`)
- [ ] npm installed (`npm -v`)
- [ ] Git installed
- [ ] Firebase account created
- [ ] Text editor (VS Code, etc.)
- [ ] Terminal/Command Line access

## Firebase Setup 🔥

### Create Project
- [ ] Go to https://console.firebase.google.com
- [ ] Click "Add project"
- [ ] Name: Your choice (e.g., "dgen-access")
- [ ] Disable Analytics (optional)
- [ ] Click "Create project"

### Enable Databases
- [ ] Enable Firestore Database
  - [ ] Go to Build → Firestore Database
  - [ ] Click "Create database"
  - [ ] Select "Production mode"
  - [ ] Choose location closest to you
- [ ] Enable Realtime Database
  - [ ] Go to Build → Realtime Database
  - [ ] Click "Create database"
  - [ ] Select "Locked mode"
  - [ ] Choose same location

### Get Backend Credentials
- [ ] Go to Project Settings → Service Accounts
- [ ] Click "Generate new private key"
- [ ] Save the JSON file securely
- [ ] Note these values from the JSON:
  - [ ] `project_id`
  - [ ] `client_email`
  - [ ] `private_key`
- [ ] Note the Database URL (ends with .firebaseio.com)

### Get Frontend Credentials
- [ ] Go to Project Settings → General
- [ ] Scroll to "Your apps" section
- [ ] Click Web icon (</>)
- [ ] Register app name: "DGEN Dashboard"
- [ ] Copy Firebase config object
- [ ] Note these values:
  - [ ] `apiKey`
  - [ ] `authDomain`
  - [ ] `projectId`
  - [ ] `storageBucket`
  - [ ] `messagingSenderId`
  - [ ] `appId`
  - [ ] `databaseURL`

## Installation 📦

### Clone Repository
```bash
git clone https://github.com/MrTG1B/DGEN-ACESS.git
cd DGEN-ACESS
```

- [ ] Repository cloned
- [ ] Changed to project directory

### Run Setup Script
```bash
chmod +x setup.sh
./setup.sh
```

- [ ] Setup script executed
- [ ] Backend dependencies installed
- [ ] Frontend dependencies installed
- [ ] Root dependencies installed
- [ ] `.env.example` files copied to `.env`

## Configuration ⚙️

### Configure Backend
```bash
cd backend
nano .env  # or code .env or vi .env
```

Edit `backend/.env` with your Firebase credentials:

- [ ] Set `FIREBASE_PROJECT_ID`
- [ ] Set `FIREBASE_CLIENT_EMAIL`
- [ ] Set `FIREBASE_PRIVATE_KEY` (keep the quotes and \n)
- [ ] Set `FIREBASE_DATABASE_URL`
- [ ] Set `PORT=5000` (or your choice)
- [ ] Set `ALLOWED_ORIGINS` (include http://localhost:3000)
- [ ] Save file

### Configure Frontend
```bash
cd ../frontend
nano .env  # or code .env or vi .env
```

Edit `frontend/.env` with your Firebase credentials:

- [ ] Set `VITE_API_URL=http://localhost:5000`
- [ ] Set `VITE_FIREBASE_API_KEY`
- [ ] Set `VITE_FIREBASE_AUTH_DOMAIN`
- [ ] Set `VITE_FIREBASE_PROJECT_ID`
- [ ] Set `VITE_FIREBASE_STORAGE_BUCKET`
- [ ] Set `VITE_FIREBASE_MESSAGING_SENDER_ID`
- [ ] Set `VITE_FIREBASE_APP_ID`
- [ ] Set `VITE_FIREBASE_DATABASE_URL`
- [ ] Save file

## Deploy Firebase Rules 🔒

### Install Firebase CLI (if needed)
```bash
npm install -g firebase-tools
```

- [ ] Firebase CLI installed

### Login and Deploy
```bash
firebase login
```

- [ ] Logged into Firebase

```bash
firebase init
```

- [ ] Select Firestore
- [ ] Select Realtime Database
- [ ] Use existing project
- [ ] Select your project
- [ ] Accept default Firestore rules file
- [ ] Accept default Firestore indexes file
- [ ] Accept default Realtime DB rules file

```bash
firebase deploy --only firestore:rules,database
```

- [ ] Firestore rules deployed
- [ ] Realtime Database rules deployed
- [ ] No errors reported

## Start Application 🚀

### Start Backend
Open Terminal 1:
```bash
cd backend
npm start
```

Wait for message: `Server running on: http://localhost:5000`

- [ ] Backend started successfully
- [ ] No error messages
- [ ] Port 5000 is listening

### Start Frontend
Open Terminal 2:
```bash
cd frontend
npm run dev
```

Wait for message: `Local: http://localhost:3000`

- [ ] Frontend started successfully
- [ ] No error messages
- [ ] Port 3000 is listening

### Open Dashboard
```bash
# Open in browser
http://localhost:3000
```

- [ ] Dashboard opens in browser
- [ ] No console errors (press F12 to check)
- [ ] Dashboard shows statistics
- [ ] All 4 pages accessible (Dashboard, Employees, Logs, Settings)

## Testing ✅

### Test Dashboard
- [ ] Dashboard page loads
- [ ] Statistics show (Total: 4, Active: 4, etc.)
- [ ] System status shows "Online" and "Connected"
- [ ] ESP32 endpoint URL is displayed

### Test Employees Page
- [ ] Navigate to Employees page
- [ ] See 4 super admin users listed
- [ ] Click "Add Employee"
- [ ] Fill in:
  - [ ] ID: DGEN-TE-01
  - [ ] Name: Test User
  - [ ] Role: Tester
- [ ] Click "Add Employee"
- [ ] New employee appears in table
- [ ] Toggle status (ban/unban) works
- [ ] Delete works for test user
- [ ] Cannot delete super admins

### Test Logs Page
- [ ] Navigate to Logs page
- [ ] Page loads (may be empty initially)
- [ ] Real-time indicator shows green if Firebase connected

### Test Settings Page
- [ ] Navigate to Settings page
- [ ] Firebase configuration displayed
- [ ] API endpoint shown
- [ ] No errors

### Test ESP32 Endpoint
Open Terminal 3:
```bash
cd DGEN-ACESS
./test-esp32-endpoint.sh
```

Expected results:
- [ ] Test 1 (Valid user): ✅ PASSED
- [ ] Test 2 (Invalid user): ✅ PASSED
- [ ] Test 3 (Empty data): ✅ PASSED
- [ ] Test 4 (User by name): ✅ PASSED
- [ ] Test 5 (Formatted data): ✅ PASSED
- [ ] Test 6 (JSON format): ✅ PASSED
- [ ] All tests passed message

### Manual ESP32 Test
```bash
curl -X POST http://localhost:5000/verify -d "data=DGEN-EX-01"
```

- [ ] Returns: `YES`

```bash
curl -X POST http://localhost:5000/verify -d "data=INVALID-ID"
```

- [ ] Returns: `NO`

### Test Real-time Updates
1. Open Dashboard in two browser tabs
2. In Terminal 3, run:
```bash
curl -X POST http://localhost:5000/verify -d "data=DGEN-EX-01"
```

- [ ] Both tabs show new log entry
- [ ] No page refresh needed
- [ ] Real-time update works

## Production Deployment 🌐

### Option A: Docker (Recommended for quick deploy)
```bash
docker-compose up -d
```

- [ ] Docker images built
- [ ] Containers running
- [ ] Backend accessible
- [ ] Frontend accessible

### Option B: Cloud Platform
Choose your platform and follow deployment guide in README_v2.md:

- [ ] Platform chosen
- [ ] Backend deployed
- [ ] Frontend deployed
- [ ] Environment variables set
- [ ] Custom domain configured (optional)
- [ ] SSL/HTTPS enabled

## Final Verification ✓

- [ ] Dashboard accessible from production URL
- [ ] All pages work correctly
- [ ] Can add/edit/delete employees
- [ ] Logs are being recorded
- [ ] ESP32 endpoint responds correctly
- [ ] Real-time updates work
- [ ] No console errors
- [ ] Mobile responsive (test on phone)

## Update ESP32 Code 🔌

In your ESP32 Arduino code, update:

```cpp
const char* serverUrl = "http://YOUR-SERVER-IP:5000/verify";
// Or if using domain:
const char* serverUrl = "https://your-domain.com/verify";
```

- [ ] ESP32 code updated
- [ ] New server URL set
- [ ] Code uploaded to ESP32
- [ ] ESP32 tested with actual RFID cards
- [ ] Access grants work
- [ ] Access denials work
- [ ] Logs appear in dashboard

## Documentation 📖

Read the following documents:

- [ ] README_v2.md (comprehensive documentation)
- [ ] QUICKSTART.md (15-minute guide)
- [ ] MIGRATION.md (if migrating from v1)
- [ ] PROJECT_SUMMARY.md (overview)

## Backup & Security 🔒

- [ ] `.env` files backed up securely (DO NOT commit to git)
- [ ] Firebase service account JSON saved securely
- [ ] Firebase security rules reviewed
- [ ] CORS settings configured correctly
- [ ] Environment variables documented
- [ ] Access to Firebase console secured

## Support 🆘

If you encounter issues:

1. Check the console for error messages (F12 in browser)
2. Check backend terminal for errors
3. Review configuration files
4. Verify Firebase credentials
5. Check documentation files
6. Run test scripts
7. Check GitHub issues
8. Contact development team

## Congratulations! 🎉

You have successfully set up DGEN Access Control System v2.0!

Your system is now:
- ✅ Running with modern architecture
- ✅ Connected to Firebase cloud database
- ✅ Featuring real-time updates
- ✅ Compatible with existing ESP32 code
- ✅ Enterprise-ready and scalable

---

**Next Steps:**
1. Add your team members to the Employees page
2. Test with your ESP32 devices
3. Monitor logs for access attempts
4. Deploy to production when ready
5. Configure custom domain (optional)

**Maintenance:**
- Regularly backup Firebase data
- Monitor Firebase usage (check quotas)
- Update dependencies periodically
- Review security rules quarterly
- Monitor access logs for suspicious activity

**Resources:**
- Documentation: README_v2.md
- Quick Reference: QUICKSTART.md
- Support: Contact development team
- Firebase Console: https://console.firebase.google.com

Enjoy your new premium access control system! 🚀
