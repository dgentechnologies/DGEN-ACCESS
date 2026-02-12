# DGEN Access Control System - Complete Setup Guide

## Prerequisites

1. **Node.js 18+** installed on your system
2. **Firebase Account** with a project created
3. **Git** installed

## Step 1: Clone the Repository

```bash
git clone https://github.com/MrTG1B/DGEN-ACESS.git
cd DGEN-ACESS
```

## Step 2: Install Dependencies

```bash
npm install
```

## Step 3: Firebase Setup

### 3.1 Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project" or select existing project
3. Follow the setup wizard

### 3.2 Enable Firestore Database

1. In Firebase Console, go to **Firestore Database**
2. Click "Create database"
3. Choose **Start in production mode** (we'll deploy rules later)
4. Select your preferred location (e.g., `asia-southeast1`)

### 3.3 Enable Realtime Database

1. In Firebase Console, go to **Realtime Database**
2. Click "Create Database"
3. Choose **Start in locked mode** (we'll deploy rules later)
4. Select your preferred location

### 3.4 Get Service Account Credentials

1. Go to **Project Settings** (gear icon) → **Service Accounts**
2. Click **"Generate new private key"**
3. Download the JSON file
4. **Keep this file secure and never commit it to Git!**

### 3.5 Get Web App Configuration

1. In Firebase Console, go to **Project Settings**
2. Scroll down to **"Your apps"**
3. Click the web icon (`</>`) to add a web app
4. Register your app (name: "DGEN Access Control")
5. Copy the Firebase configuration object

## Step 4: Environment Configuration

Create a `.env.local` file in the root directory:

```bash
cp .env.example .env.local
```

Edit `.env.local` and add your Firebase credentials from the service account JSON:

```env
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYourPrivateKeyHere\n-----END PRIVATE KEY-----\n"
FIREBASE_DATABASE_URL=https://your-project-default-rtdb.firebaseio.com
```

**Important Notes:**
- Keep the quotes around `FIREBASE_PRIVATE_KEY`
- Ensure `\n` characters are preserved in the private key
- Never commit `.env.local` to version control

## Step 5: Update Frontend Firebase Config

Edit `src/lib/firebase.js` with your web app configuration:

```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  databaseURL: "https://YOUR_PROJECT-default-rtdb.firebaseio.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.firebasestorage.app",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID",
  measurementId: "YOUR_MEASUREMENT_ID"
};
```

## Step 6: Deploy Firebase Security Rules

Install Firebase CLI if you haven't already:

```bash
npm install -g firebase-tools
```

Login to Firebase:

```bash
firebase login
```

Initialize Firebase in your project (if not already done):

```bash
firebase init
```

Select:
- ✓ Firestore
- ✓ Realtime Database
- Use existing project
- Select your project

Deploy the security rules:

```bash
firebase deploy --only firestore:rules
firebase deploy --only database
```

## Step 7: Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Step 8: Verify Setup

1. **Dashboard**: Should load without errors
2. **Employees Page**: Should show 4 default super admins
3. **Access Logs**: Should be empty initially
4. **Console**: Check browser console for any errors

## Default Super Admin Users

The system automatically creates 5 super admin users on first run:

| Name | ID | Role |
|------|-----|------|
| System Administrator | DGEN-ADM-00 | Superuser / Admin |
| Tirthankar Dasgupta | DGEN-EX-01 | CEO & CTO |
| Sukomal Debnath | DGEN-FI-02 | CFO |
| Arpan Bairagi | DGEN-OP-03 | COO |
| Sagnik Mandal | DGEN-MK-04 | CMO |

These users cannot be deleted through the UI.

## Step 9: Deploy to Vercel

### 9.1 Install Vercel CLI

```bash
npm install -g vercel
```

### 9.2 Deploy

```bash
vercel
```

### 9.3 Set Environment Variables in Vercel

Go to your Vercel dashboard → Project Settings → Environment Variables

Add all variables from `.env.local`:
- `FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY`
- `FIREBASE_DATABASE_URL`

### 9.4 Redeploy

```bash
vercel --prod
```

## Troubleshooting

### Error: "Firebase not configured"

**Solution**: Check that:
1. `.env.local` file exists with correct credentials
2. Private key includes `\n` characters and is wrapped in quotes
3. You've restarted the development server after creating `.env.local`

### Error: "Request failed with status code 500"

**Solution**: 
1. Check server logs: `npm run dev` and look for Firebase initialization errors
2. Verify Firebase credentials in `.env.local`
3. Ensure Firebase Database URL is correct
4. Check that Firestore and Realtime Database are enabled in Firebase Console

### Error: "Permission denied" when accessing Firebase

**Solution**:
1. Deploy Firebase security rules: `firebase deploy --only firestore:rules,database`
2. Or temporarily set rules to allow all access (NOT recommended for production):

**Firestore (for testing only):**
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

**Realtime Database (for testing only):**
```json
{
  "rules": {
    ".read": true,
    ".write": true
  }
}
```

### Firebase Rules Not Applying

**Solution**:
1. Make sure `firebase.json` exists in root directory
2. Run `firebase deploy --only firestore:rules,database`
3. Wait a few seconds for rules to propagate
4. Refresh your application

## ESP32 Integration

After deployment, configure your ESP32 to send POST requests to:

```
https://dgen-access-control.vercel.app/verify
```

With form data:
```
data=DGEN-EX-01
```

The endpoint will respond with:
- `"YES"` - Access granted
- `"NO"` - Access denied

## Security Best Practices

1. **Never commit `.env.local`** to version control
2. **Keep service account credentials secure**
3. **Use environment variables** for all sensitive data
4. **Enable Firebase App Check** for production
5. **Add authentication** to admin dashboard for production use
6. **Review and tighten Firebase security rules** based on your needs
7. **Enable Firebase Audit Logs** to track API usage
8. **Set up Firebase Budget Alerts** to avoid unexpected charges

## API Endpoints

### User Management
- `GET /api/users` - Get all users
- `POST /api/users` - Add new user
- `PUT /api/users/[id]` - Update user
- `PUT /api/users/[id]/status` - Toggle user status
- `DELETE /api/users/[id]` - Delete user

### Access Logs
- `GET /api/logs?limit=100` - Get access logs
- `DELETE /api/logs` - Clear all logs

### ESP32 Verification
- `POST /api/verify` - Verify RFID card

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review Firebase Console for errors
3. Check server logs: `npm run dev`
4. Open an issue on GitHub

## License

ISC License - DGEN Technologies
