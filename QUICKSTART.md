# Quick Start Guide

Get your DGEN Access Control System running in 5 minutes!

## Prerequisites

- Node.js 18+ installed
- Firebase project created ([console.firebase.google.com](https://console.firebase.google.com))

## Setup Steps

### 1. Clone & Install

```bash
git clone https://github.com/MrTG1B/DGEN-ACESS.git
cd DGEN-ACESS
npm install
```

### 2. Firebase Console Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project (or create a new one)
3. **Enable Firestore Database**:
   - Go to Firestore Database → Create Database → Production Mode
   - Choose location (e.g., asia-southeast1)
4. **Enable Realtime Database**:
   - Go to Realtime Database → Create Database → Locked Mode
   - Choose location
5. **Get Service Account**:
   - Go to Project Settings → Service Accounts
   - Click "Generate new private key" → Download JSON file

### 3. Environment Setup

```bash
# Copy example file
cp .env.example .env.local

# Edit .env.local with your Firebase credentials from the JSON file:
# - projectId → FIREBASE_PROJECT_ID
# - client_email → FIREBASE_CLIENT_EMAIL
# - private_key → FIREBASE_PRIVATE_KEY (keep the quotes!)
# - Add your database URL → FIREBASE_DATABASE_URL
```

**Example .env.local:**
```env
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYourKeyHere\n-----END PRIVATE KEY-----\n"
FIREBASE_DATABASE_URL=https://your-project-default-rtdb.firebaseio.com
```

### 4. Deploy Firebase Rules

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login and initialize
firebase login
firebase init

# Select: Firestore, Realtime Database
# Use existing project: Select your project
# Accept default files (firestore.rules, database.rules.json)

# Deploy rules
firebase deploy --only firestore:rules,database
```

### 5. Update Frontend Config (Optional)

Edit `src/lib/firebase.js` with your web app configuration:

```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "your-project.firebaseapp.com",
  databaseURL: "https://your-project-default-rtdb.firebaseio.com",
  projectId: "your-project-id",
  storageBucket: "your-project.firebasestorage.app",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef",
  measurementId: "G-XXXXXXXXXX"
};
```

### 6. Validate Configuration (Optional but Recommended)

```bash
npm run validate-config
```

This will check if all environment variables are set correctly.

### 7. Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## ✅ Verify Setup

You should see:
- ✓ Dashboard loads without errors
- ✓ 4 default super admin users in Employees page
- ✓ No console errors
- ✓ Firebase connection status: Connected

## 🚀 Deploy to Vercel

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel

# Set environment variables in Vercel dashboard
# Then deploy to production
vercel --prod
```

## ⚠️ Troubleshooting

### "Firebase not configured" error

**Fix:** Check your `.env.local` file:
```bash
npm run validate-config
```

### API returns 500 errors

**Fixes:**
1. Restart dev server: `npm run dev`
2. Check Firebase credentials in `.env.local`
3. Verify Firestore and Realtime Database are enabled in Firebase Console
4. Deploy Firebase rules: `firebase deploy --only firestore:rules,database`

### "Permission denied" errors

**Fix:** Deploy Firebase rules:
```bash
firebase deploy --only firestore:rules,database
```

## 📚 Need More Help?

- **Detailed Setup:** See [SETUP.md](SETUP.md)
- **GitHub Issues:** [Open an issue](https://github.com/MrTG1B/DGEN-ACESS/issues)
- **Firebase Docs:** [firebase.google.com/docs](https://firebase.google.com/docs)

## 🔗 ESP32 Integration

After deployment, configure your ESP32 to POST to:

```
https://dgen-access-control.vercel.app/verify
```

Send form data:
```
data=DGEN-EX-01
```

Response:
- `"YES"` = Access granted
- `"NO"` = Access denied

---

**Ready to go? Run `npm run dev` and visit http://localhost:3000** 🎉
