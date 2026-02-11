# DGEN Access Control System

> 🚀 **Version 3.0 - Next.js Edition** Built with React, Next.js, TailwindCSS, and Firebase

**📚 Documentation:**
- ⚡ [Quick Start](QUICKSTART.md) - Get running in 5 minutes
- 📖 [Setup Guide](SETUP.md) - Detailed setup instructions
- 🚀 [Deployment Guide](DEPLOYMENT.md) - Deploy to production
- 🔧 [Troubleshooting](TROUBLESHOOTING.md) - Common issues & solutions

A complete, modern Access Control Server for IoT projects with ESP32 integration, built with Next.js and designed for Vercel deployment.

## 🚀 Features

- **ESP32 Integration**: Receives RFID data from ESP32 devices for access verification
- **Real-time Admin Dashboard**: Modern web interface with dark theme and animations
- **User Management**: Add, delete, and toggle access rights instantly
- **Live Access Logs**: Real-time logging of all access attempts with Firebase
- **Protected Super Admins**: 4 permanent executive users that cannot be deleted
- **Firebase Integration**: Full Firebase Firestore and Realtime Database support

## 📋 Default Super Admin Users

| Name | ID | Role | Status |
| :--- | :--- | :--- | :--- |
| **Tirthankar Dasgupta** | `DGEN-EX-01` | CEO & CTO | Active |
| **Sukomal Debnath** | `DGEN-FI-02` | CFO | Active |
| **Arpan Bairagi** | `DGEN-OP-03` | COO | Active |
| **Sagnik Mandal** | `DGEN-MK-04` | CMO | Active |

## 🔧 Tech Stack

- **Frontend**: React 19, Next.js 16
- **Styling**: TailwindCSS 4
- **Backend**: Next.js API Routes (serverless)
- **Database**: Firebase Firestore & Realtime Database
- **Deployment**: Vercel
- **Animations**: Framer Motion
- **Icons**: Heroicons

## 📁 Project Structure

```
.
├── src/
│   ├── app/
│   │   ├── api/           # API Routes (serverless functions)
│   │   │   ├── users/     # User management endpoints
│   │   │   ├── logs/      # Access logs endpoints
│   │   │   └── verify/    # ESP32 verification endpoint
│   │   ├── employees/     # Employee management page
│   │   ├── logs/          # Access logs page
│   │   ├── settings/      # Settings page
│   │   ├── globals.css    # Global styles
│   │   ├── layout.js      # Root layout
│   │   └── page.js        # Dashboard page
│   ├── components/        # React components
│   ├── lib/              # Firebase config & utilities
│   └── services/         # API service layer
├── package.json
├── next.config.js
├── tailwind.config.js
└── vercel.json
```

## 🌐 API Endpoints

### ESP32 Endpoint
- **POST `/api/verify`**: Verify RFID data
  - Input: Form data with `data` field or `{"data": "DGEN-EX-01"}`
  - Output: `"YES"` (access granted) or `"NO"` (access denied)

### Admin Dashboard Endpoints
- **GET `/api/users`**: Get all users
- **POST `/api/users`**: Add new user
- **PUT `/api/users/[id]`**: Update user
- **PUT `/api/users/[id]/status`**: Toggle user status
- **DELETE `/api/users/[id]`**: Delete user
- **GET `/api/logs`**: Get access logs
- **DELETE `/api/logs`**: Clear all logs

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- Firebase project with Firestore and Realtime Database enabled
- Firebase service account credentials

### Installation & Setup

**For detailed setup instructions, see [SETUP.md](SETUP.md)**

Quick start:

1. Clone the repository:
   ```bash
   git clone https://github.com/MrTG1B/DGEN-ACESS.git
   cd DGEN-ACESS
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env.local
   ```
   
   Edit `.env.local` and add your Firebase Admin credentials.
   See [SETUP.md](SETUP.md) for detailed instructions.

4. Deploy Firebase security rules:
   ```bash
   firebase login
   firebase init  # Select Firestore and Realtime Database
   firebase deploy --only firestore:rules,database
   ```

5. Run development server:
   ```bash
   npm run dev
   ```

6. Open browser:
   ```
   http://localhost:3000
   ```

**Having issues?** Check the [SETUP.md](SETUP.md) troubleshooting section.

## 📦 Deployment

### Deploy to Vercel

1. Install Vercel CLI:
   ```bash
   npm install -g vercel
   ```

2. Deploy:
   ```bash
   vercel
   ```

3. Set environment variables in Vercel dashboard:
   - `FIREBASE_PROJECT_ID`
   - `FIREBASE_CLIENT_EMAIL`
   - `FIREBASE_PRIVATE_KEY`
   - `FIREBASE_DATABASE_URL`

### One-Click Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/MrTG1B/DGEN-ACESS)

## 📝 ESP32 Integration

### Arduino Example
```cpp
#include <WiFi.h>
#include <HTTPClient.h>

const char* serverUrl = "https://your-app.vercel.app/api/verify";

void checkAccess(String rfidData) {
  HTTPClient http;
  http.begin(serverUrl);
  http.addHeader("Content-Type", "application/x-www-form-urlencoded");
  
  String payload = "data=" + rfidData;
  int httpCode = http.POST(payload);
  
  if (httpCode == 200) {
    String response = http.getString();
    if (response == "YES") {
      // Grant access - open door, green LED, etc.
      Serial.println("Access Granted!");
    } else {
      // Deny access - red LED, buzzer, etc.
      Serial.println("Access Denied!");
    }
  }
  http.end();
}
```

## 🔐 Security Notes

- Firebase credentials are stored securely in environment variables
- API routes use Firebase Admin SDK for server-side operations
- Frontend Firebase config is client-safe (no private keys)
- Consider adding authentication for admin dashboard in production

## 🐛 Troubleshooting

Having issues? Check the [Troubleshooting Guide](TROUBLESHOOTING.md) for common problems and solutions.

## 📄 License

This project is provided as-is for DGEN Technologies.

## 🤝 Support

For issues or questions:
- 📖 Read the [Troubleshooting Guide](TROUBLESHOOTING.md)
- 💬 Open an issue on [GitHub](https://github.com/MrTG1B/DGEN-ACESS/issues)
- 📧 Contact the development team
