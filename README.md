# DGEN Access Control System

> 🚀 **Version 3.0 - Next.js Edition** Built with React, Next.js, TailwindCSS, and Firebase

**📚 Documentation:**
- ⚡ [Quick Start](QUICKSTART.md) - Get running in 5 minutes
- 📖 [Setup Guide](SETUP.md) - Detailed setup instructions
- 🔐 [Authentication Guide](AUTHENTICATION.md) - User authentication and roles
- 🚀 [Deployment Guide](DEPLOYMENT.md) - Deploy to production
- 🔧 [Troubleshooting](TROUBLESHOOTING.md) - Common issues & solutions
- 📝 [Changelog](CHANGELOG.md) - What's new

A complete, modern Access Control Server for IoT projects with ESP32 integration, built with Next.js and designed for Vercel deployment.

## 🚀 Features

- **User Authentication**: Secure login system with employee ID and password
- **Role-Based Access Control**: Separate admin and employee portals with different permissions
- **ESP32 Integration**: Receives RFID data from ESP32 devices for access verification
- **Real-time Admin Dashboard**: Modern web interface with dark theme and animations
- **User Management**: Add, delete, and toggle access rights instantly (Admin only)
- **Employee Portal**: Simple interface for normal employees with remote unlock button
- **Live Access Logs**: Real-time logging of all access attempts with employee tracking
- **Protected Super Admins**: 5 permanent executive users that cannot be deleted
- **Firebase Integration**: Full Firebase Firestore and Realtime Database support

## 🔐 Authentication System

### Login Credentials
- **Employee ID**: Your unique employee identifier (e.g., DGEN-ADM-00)
- **Password**: Same as your employee ID (for first-time login)

### User Roles
- **Admin Users**: Full access to dashboard, employee management, logs, and settings
- **Regular Employees**: Access to employee portal with remote unlock button only

### Default Admin Access
All super admin users have administrator privileges by default. When creating new employees, administrators can grant admin access by checking the "Administrator Access" checkbox during user creation.

## 📋 Default Super Admin Users

| Name | ID | Role | Status |
| :--- | :--- | :--- | :--- |
| **System Administrator** | `DGEN-ADM-00` | Superuser / Admin | Active |
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
│   │   ├── api/              # API Routes (serverless functions)
│   │   │   ├── auth/         # Authentication endpoints
│   │   │   ├── users/        # User management endpoints
│   │   │   ├── logs/         # Access logs endpoints
│   │   │   ├── remote-open/  # Remote unlock endpoint
│   │   │   └── verify/       # ESP32 verification endpoint
│   │   ├── employee-portal/  # Employee portal page (non-admin)
│   │   ├── employees/        # Employee management page (admin)
│   │   ├── login/            # Login page
│   │   ├── logs/             # Access logs page (admin)
│   │   ├── settings/         # Settings page (admin)
│   │   ├── globals.css       # Global styles
│   │   ├── layout.js         # Root layout with AuthProvider
│   │   └── page.js           # Dashboard page (admin)
│   ├── components/           # React components
│   │   ├── Header.js         # Header with user menu
│   │   ├── Sidebar.js        # Navigation sidebar
│   │   ├── LayoutWrapper.js  # Protected layout wrapper
│   │   └── ProtectedRoute.js # Route protection HOC
│   ├── contexts/             # React contexts
│   │   └── AuthContext.js    # Authentication context
│   ├── lib/                  # Firebase config & utilities
│   └── services/             # API service layer
├── package.json
├── next.config.js
├── tailwind.config.js
└── vercel.json
```

## 🌐 API Endpoints

### Authentication Endpoints
- **POST `/api/auth/login`**: User login
  - Input: `{"employeeId": "DGEN-ADM-00", "password": "DGEN-ADM-00"}`
  - Output: `{"success": true, "user": {...}}`
  - Note: Password is the same as employee ID by default

### ESP32 Endpoint
- **POST `/api/verify`**: Verify RFID data
  - Input: Form data with `data` field or `{"data": "DGEN-EX-01"}`
  - Output: `"YES"` (access granted) or `"NO"` (access denied)

### ESP8266 Remote Unlock Endpoint
- **GET `/poll`**: Polling endpoint for remote unlock
  - Returns: `"OPEN"` (trigger unlock) or `"WAIT"` (no action)
  - ESP8266 should poll this every 3 seconds
  - Example: `https://dgen-access-control.vercel.app/poll`

### Admin Dashboard Endpoints
- **GET `/api/users`**: Get all users
- **POST `/api/users`**: Add new user (with optional `isAdmin` field)
- **PUT `/api/users/[id]`**: Update user
- **PUT `/api/users/[id]/status`**: Toggle user status
- **DELETE `/api/users/[id]`**: Delete user
- **GET `/api/logs`**: Get access logs
- **DELETE `/api/logs`**: Clear all logs
- **POST `/api/remote-open`**: Trigger remote door unlock (logs employee ID)

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

The complete, ready-to-flash Arduino sketch lives in **[`esp32/rfid_access_control.ino`](esp32/rfid_access_control.ino)**.

### Card text format

Every physical RFID card is programmed with a single NDEF text record in this exact format:

```
Name: Tirthankar Dasgupta | ID: DGEN-EX-01001 | Role: CEO & CTO
```

The employee ID (`DGEN-EX-01001`) is the same key used in the Realtime Database and Firestore.

### Verification flow (no Vercel / no cold-start delay)

```
1. ESP32 reads card  →  extracts full text string
2. Parse "ID: <value> |"  →  cardId = "DGEN-EX-01001"
3. GET  https://<RTDB>/rfid_cards/<cardId>.json
        ↳ returns { cardText, status, name, role, department, userId }
4. Compare returned cardText == what was read  →  reject if different (tampered card)
5. Check status == "Active"  →  deny if "Banned"
6. Actuate relay / green LED (grant) or red LED (deny)
7. POST https://<RTDB>/access_logs.json
        ↳ { cardId, userId, name, status:"Granted"|"Denied", timestamp, synced:false }
8. POST https://<vercel>/api/esp/log  (background, non-blocking)
        ↳ Vercel flushes unsynced RTDB logs → Firestore → dashboard updates
```

### Required Arduino libraries

Install these from the Arduino Library Manager:
- **ArduinoJson** by Benoit Blanchon (v6 or v7)
- **MFRC522** by GithubCommunity

The `WiFi` and `HTTPClient` libraries are bundled with the ESP32 Arduino core.

### Quick start

1. Open `esp32/rfid_access_control.ino` in the Arduino IDE.
2. Set `WIFI_SSID`, `WIFI_PASSWORD`, `RTDB_BASE_URL`, and `VERCEL_LOG_URL`.
3. Wire the MFRC522 to the ESP32 via SPI (SS=5, RST=22) and connect relay/LEDs.
4. Flash and open the serial monitor at 115200 baud.

## 🔐 Security Notes

### ⚠️ IMPORTANT: Development Authentication
**This implementation uses simplified authentication for demonstration purposes. DO NOT use in production without implementing proper security:**

- **Current Implementation**: Password is the same as employee ID (INSECURE)
- **Required for Production**:
  - Implement password hashing (bcrypt, argon2, or similar)
  - Store hashed passwords in database
  - Require strong, unique passwords during account creation
  - Use secure session tokens instead of localStorage
  - Implement HTTP-only cookies for session management
  - Add rate limiting on login attempts
  - Enable two-factor authentication (2FA)

### Current Security Features
- **Authentication Required**: All pages except login require user authentication
- **Role-Based Access**: Admin features are restricted to users with admin privileges
- **Session Management**: Basic session management with localStorage validation
- **Firebase Security**: Server credentials are stored securely in environment variables
- **API Security**: API routes use Firebase Admin SDK for server-side operations
- **Audit Trail**: All remote unlock actions are logged with employee ID for accountability

## 🐛 Troubleshooting

Having issues? Check the [Troubleshooting Guide](TROUBLESHOOTING.md) for common problems and solutions.

## 📄 License

This project is provided as-is for DGEN Technologies.

## 🤝 Support

For issues or questions:
- 📖 Read the [Troubleshooting Guide](TROUBLESHOOTING.md)
- 💬 Open an issue on [GitHub](https://github.com/MrTG1B/DGEN-ACESS/issues)
- 📧 Contact the development team
