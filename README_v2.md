# DGEN Access Control System v2.0

A premium, professional Access Control System with React frontend, Node.js backend, and Firebase integration. This system provides real-time employee access management with ESP32 IoT device support.

## 🚀 Features

### Frontend (React)
- **Modern Dashboard**: Real-time statistics and system status
- **Employee Management**: Add, edit, ban/unban, and delete employees
- **Live Access Logs**: Real-time monitoring with Firebase Realtime Database
- **Settings Panel**: System configuration and documentation
- **Responsive Design**: Works on all devices
- **Dark Theme**: Premium cyberpunk aesthetic with Tailwind CSS

### Backend (Node.js + Express)
- **RESTful API**: Complete CRUD operations for users and logs
- **Firebase Integration**: Firestore for data persistence, Realtime DB for live updates
- **ESP32 Compatible**: Maintains backward compatibility with existing ESP32 code
- **Secure**: CORS protection, Helmet security headers
- **Scalable**: Firebase-powered architecture

### Database (Firebase)
- **Firestore**: Persistent storage for users and logs
- **Realtime Database**: Live updates for access logs
- **Security Rules**: Comprehensive access control
- **Cloud-based**: No server maintenance required

## 📁 Project Structure

```
DGEN-ACESS/
├── backend/                    # Node.js API Server
│   ├── config/
│   │   └── firebase.js        # Firebase Admin SDK configuration
│   ├── routes/
│   │   ├── verify.js          # ESP32 verification endpoint
│   │   ├── users.js           # User management endpoints
│   │   └── logs.js            # Logs endpoints
│   ├── server.js              # Express server entry point
│   ├── package.json
│   └── .env.example           # Backend environment variables template
│
├── frontend/                   # React Dashboard
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Layout.jsx     # Main layout wrapper
│   │   │   └── Sidebar.jsx    # Left navigation panel
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx  # Dashboard landing page
│   │   │   ├── Employees.jsx  # Employee management
│   │   │   ├── Logs.jsx       # Access logs viewer
│   │   │   └── Settings.jsx   # Settings page
│   │   ├── services/
│   │   │   ├── api.js         # Axios configuration
│   │   │   └── dataService.js # API service methods
│   │   ├── config/
│   │   │   └── firebase.js    # Firebase client configuration
│   │   ├── App.jsx            # Main app component
│   │   ├── main.jsx           # React entry point
│   │   └── index.css          # Global styles
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── .env.example           # Frontend environment variables template
│
├── .firebase/
│   ├── firestore.rules        # Firestore security rules
│   ├── database.rules.json    # Realtime DB security rules
│   └── firestore.indexes.json # Firestore indexes
│
├── firebase.json               # Firebase configuration
├── README.md                   # This file
└── .gitignore

# Legacy files (kept for reference)
├── api/
│   └── index.py               # Old Flask API (deprecated)
├── templates/
│   └── dashboard.html         # Old dashboard (deprecated)
└── vercel.json                # Old Vercel config (deprecated)
```

## 🔧 Prerequisites

- Node.js 16+ and npm
- Firebase account
- Firebase CLI (optional, for deployment)

## 🚀 Quick Start

### 1. Firebase Setup

1. Create a new Firebase project at [firebase.google.com](https://firebase.google.com)
2. Enable Firestore Database
3. Enable Realtime Database
4. Generate a service account key:
   - Go to Project Settings → Service Accounts
   - Click "Generate New Private Key"
   - Save the JSON file securely

### 2. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Edit .env with your Firebase credentials
nano .env
```

**Backend .env configuration:**
```env
PORT=5000
NODE_ENV=development

# Firebase Configuration (from service account JSON)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project-id.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_DATABASE_URL=https://your-project-id.firebaseio.com

# CORS
ALLOWED_ORIGINS=http://localhost:3000,https://your-domain.com
```

```bash
# Start backend server
npm start

# Or for development with auto-reload
npm run dev
```

The backend will run on `http://localhost:5000`

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Edit .env with your Firebase web config
nano .env
```

**Frontend .env configuration:**
```env
VITE_API_URL=http://localhost:5000

# Firebase Web Configuration (from Firebase Console → Project Settings → Web App)
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef
VITE_FIREBASE_DATABASE_URL=https://your-project-id.firebaseio.com
```

```bash
# Start frontend development server
npm run dev
```

The frontend will run on `http://localhost:3000`

### 4. Deploy Firebase Rules

```bash
# Install Firebase CLI (if not already installed)
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firebase (select Firestore and Realtime Database)
firebase init

# Deploy security rules
firebase deploy --only firestore:rules,database
```

## 🌐 API Endpoints

### ESP32 Endpoint (Backward Compatible)

**POST** `/verify`
- **Purpose**: Verify RFID data from ESP32
- **Input**: Form data with `data` field OR JSON `{"data": "DGEN-EX-01"}`
- **Output**: Plain text `"YES"` or `"NO"`
- **Compatible**: Works with existing ESP32 code

### User Management

- **GET** `/api/users` - Get all users
- **POST** `/api/users` - Add new user
- **PUT** `/api/users/:id` - Update user
- **PUT** `/api/users/:id/status` - Toggle user status
- **DELETE** `/api/users/:id` - Delete user

### Logs

- **GET** `/api/logs?limit=100` - Get access logs
- **DELETE** `/api/logs` - Clear all logs

## 🔌 ESP32 Integration

The system maintains full backward compatibility with the existing ESP32 code. Use the same endpoint:

```cpp
#include <WiFi.h>
#include <HTTPClient.h>

const char* serverUrl = "http://your-server-ip:5000/verify";

void checkAccess(String rfidData) {
  HTTPClient http;
  http.begin(serverUrl);
  http.addHeader("Content-Type", "application/x-www-form-urlencoded");
  
  String payload = "data=" + rfidData;
  int httpCode = http.POST(payload);
  
  if (httpCode == 200) {
    String response = http.getString();
    if (response == "YES") {
      // Grant access
      Serial.println("Access Granted");
    } else {
      // Deny access
      Serial.println("Access Denied");
    }
  }
  http.end();
}
```

## 📱 Frontend Routes

- `/` - Dashboard (landing page)
- `/employees` - Employee management
- `/logs` - Access logs
- `/settings` - System settings

## 🔒 Security

### Firestore Rules
Located in `.firebase/firestore.rules`:
- Users: Read access for all (for verification), write for authenticated users
- Logs: Read/write for authenticated users
- Super admins cannot be deleted

### Realtime Database Rules
Located in `.firebase/database.rules.json`:
- Logs: Read/write for authenticated users
- Indexed on timestamp for efficient queries

### Environment Variables
- Never commit `.env` files
- Use `.env.example` as template
- Store Firebase private keys securely

## 🏗️ Production Deployment

### Backend Deployment

**Option 1: Heroku**
```bash
cd backend
heroku create dgen-access-api
heroku config:set FIREBASE_PROJECT_ID=xxx FIREBASE_CLIENT_EMAIL=xxx ...
git push heroku main
```

**Option 2: Google Cloud Run**
```bash
gcloud run deploy dgen-access-api --source backend/
```

### Frontend Deployment

**Option 1: Firebase Hosting**
```bash
cd frontend
npm run build
firebase deploy --only hosting
```

**Option 2: Vercel**
```bash
cd frontend
vercel
```

## 👥 Default Super Admin Users

| Name | ID | Role | Status |
| :--- | :--- | :--- | :--- |
| **Tirthankar Dasgupta** | `DGEN-EX-01` | CEO & CTO | Active |
| **Sukomal Debnath** | `DGEN-FI-02` | CFO | Active |
| **Arpan Bairagi** | `DGEN-OP-03` | COO | Active |
| **Sagnik Mandal** | `DGEN-MK-04` | CMO | Active |

These users are automatically created on first backend startup and cannot be deleted.

## 🛠️ Development

### Backend Development
```bash
cd backend
npm run dev  # Starts with nodemon for auto-reload
```

### Frontend Development
```bash
cd frontend
npm run dev  # Starts Vite dev server with HMR
```

### Build for Production
```bash
# Backend (no build step needed)
cd backend
npm start

# Frontend
cd frontend
npm run build  # Creates optimized build in /build directory
npm run preview  # Preview production build
```

## 📊 Tech Stack

### Frontend
- **React 18** - UI library
- **Vite** - Build tool
- **React Router** - Routing
- **Tailwind CSS** - Styling
- **Framer Motion** - Animations
- **Heroicons** - Icons
- **React Hot Toast** - Notifications
- **Axios** - HTTP client
- **Firebase SDK** - Real-time updates

### Backend
- **Node.js** - Runtime
- **Express** - Web framework
- **Firebase Admin SDK** - Database operations
- **CORS** - Cross-origin support
- **Helmet** - Security headers
- **Morgan** - HTTP logging
- **dotenv** - Environment management

### Database
- **Firebase Firestore** - Primary database
- **Firebase Realtime Database** - Live updates

## 🐛 Troubleshooting

### Backend won't start
- Check Firebase credentials in `.env`
- Ensure PORT is not in use
- Verify Node.js version (16+)

### Frontend can't connect to backend
- Verify `VITE_API_URL` in frontend `.env`
- Check backend is running
- Verify CORS settings in backend

### Firebase connection issues
- Verify all Firebase credentials
- Check Firebase project is active
- Ensure Firestore and Realtime DB are enabled

## 📝 License

This project is provided as-is for DGEN Technologies.

## 🤝 Support

For issues or questions, please contact the development team.

---

**Version 2.0** - Complete rewrite with React, Node.js, and Firebase
